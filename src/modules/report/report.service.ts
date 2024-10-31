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

    // get attendance records for the specified date
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

    // Title
    doc.setFontSize(16);
    doc.text(
      `Daily Attendance Report - ${date.toLocaleDateString()}`,
      pageWidth / 2,
      20,
      { align: 'center' },
    );

    // set headers
    doc.setFontSize(12);
    const headers = [
      'Employee Email',
      'Full name',
      'Check-In',
      'Check-Out',
      'Hours Worked',
    ];
    let y = 40;
    const rowHeight = 10;

    const columnWidths = [70, 40, 35, 35, 35];

    let x = 20; // starting left position
    headers.forEach((header, i) => {
      doc.text(header, x, y);
      x += columnWidths[i]; // map width to each column
    });

    y += rowHeight;

    doc.setFontSize(10);
    attendanceRecords.forEach((record) => {
      if (y > 270) {
        // add new page if content exceeds the page height
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
        record.employee.email,
        `${record.employee.firstName} ${record.employee.lastName}`,
        record.checkIn.toLocaleTimeString(),
        record.checkOut ? record.checkOut.toLocaleTimeString() : 'N/A',
        hoursWorked,
      ];

      x = 20; // reset x position for each row
      row.forEach((cell, i) => {
        doc.text(String(cell), x, y);
        x += columnWidths[i];
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

    // title
    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').value =
      `Daily Attendance Report - ${date.toLocaleDateString()}`;
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // headers
    worksheet.addRow([
      'Employee email',
      'Full name',
      'Check-In Time',
      'Check-Out Time',
      'Hours Worked',
    ]);
    worksheet.getRow(2).font = { bold: true };

    // attendance data
    attendanceRecords.forEach((record) => {
      const hoursWorked = record.checkOut
        ? (
            (record.checkOut.getTime() - record.checkIn.getTime()) /
            (1000 * 60 * 60)
          ).toFixed(2)
        : 'N/A';

      worksheet.addRow([
        record.employee.email,
        `${record.employee.firstName} ${record.employee.lastName}`,
        record.checkIn.toLocaleTimeString(),
        record.checkOut ? record.checkOut.toLocaleTimeString() : 'N/A',
        hoursWorked,
      ]);
    });

    worksheet.columns.forEach((column) => {
      column.width = 20;
      column.alignment = { horizontal: 'left' };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
