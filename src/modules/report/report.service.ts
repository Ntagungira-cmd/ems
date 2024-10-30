import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { jsPDF } from 'jspdf';
import * as ExcelJS from 'exceljs';
import { Attendance } from 'src/modules/attendance/entities/attendance.entity';
import { Employee } from 'src/modules/employee/entities/employee.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async generateDailyAttendanceReport(
    date: Date,
    format: 'pdf' | 'excel',
  ): Promise<Buffer> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const attendanceRecords = await this.attendanceRepository.find({
      where: {
        checkIn: Between(startOfDay, endOfDay),
      },
      relations: ['employee'],
      order: {
        checkIn: 'ASC',
      },
    });

    return format === 'pdf'
      ? this.generatePDFReport(attendanceRecords, date)
      : this.generateExcelReport(attendanceRecords, date);
  }

  private async generatePDFReport(
    attendanceRecords: Attendance[],
    date: Date,
  ): Promise<Buffer> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Add title
    doc.setFontSize(16);
    doc.text(
      `Daily Attendance Report - ${date.toLocaleDateString()}`,
      pageWidth / 2,
      20,
      { align: 'center' },
    );

    // Add table headers
    doc.setFontSize(12);
    const headers = [
      'Employee ID',
      'Name',
      'Check-In Time',
      'Check-Out Time',
      'Hours Worked',
    ];
    let y = 40;
    const rowHeight = 10;

    headers.forEach((header, i) => {
      doc.text(header, 20 + i * 35, y);
    });

    y += rowHeight;

    // Add table data
    doc.setFontSize(10);
    attendanceRecords.forEach((record) => {
      if (y > 270) {
        // Check if we need a new page
        doc.addPage();
        y = 20;
      }

      const hoursWorked = record.checkOut
        ? (
            (record.checkOut.getTime() - record.checkIn.getTime()) /
            (1000 * 60 * 60)
          ).toFixed(2)
        : 'N/A';

      const row = [
        record.employee.id,
        `${record.employee.firstName} ${record.employee.lastName}`,
        record.checkIn.toLocaleTimeString(),
        record.checkOut ? record.checkOut.toLocaleTimeString() : 'N/A',
        hoursWorked,
      ];

      row.forEach((cell, i) => {
        doc.text(String(cell), 20 + i * 35, y);
      });

      y += rowHeight;
    });

    return Buffer.from(doc.output('arraybuffer'));
  }

  private async generateExcelReport(
    attendanceRecords: Attendance[],
    date: Date,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Daily Attendance');

    // Add title
    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').value =
      `Daily Attendance Report - ${date.toLocaleDateString()}`;
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Add headers
    worksheet.addRow([
      'Employee ID',
      'Name',
      'Check-In Time',
      'Check-Out Time',
      'Hours Worked',
    ]);
    worksheet.getRow(2).font = { bold: true };

    // Add data
    attendanceRecords.forEach((record) => {
      const hoursWorked = record.checkOut
        ? (
            (record.checkOut.getTime() - record.checkIn.getTime()) /
            (1000 * 60 * 60)
          ).toFixed(2)
        : 'N/A';

      worksheet.addRow([
        record.employee.id,
        `${record.employee.firstName} ${record.employee.lastName}`,
        record.checkIn.toLocaleTimeString(),
        record.checkOut ? record.checkOut.toLocaleTimeString() : 'N/A',
        hoursWorked,
      ]);
    });

    // Style the worksheet
    worksheet.columns.forEach((column) => {
      column.width = 20;
      column.alignment = { horizontal: 'left' };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
