import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { ParseDatePipe } from 'src/common/pipes/parse-date.pipe';

@ApiTags('reports')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('daily-attendance')
  @ApiOperation({ summary: 'Generate daily attendance report' })
  @ApiQuery({ name: 'date', required: true, type: String })
  @ApiQuery({ name: 'format', enum: ['pdf', 'excel'], required: true })
  async generateDailyAttendanceReport(
    @Query('date', ParseDatePipe) date: Date,
    @Query('format') format: 'pdf' | 'excel',
    @Res() res: Response,
  ) {
    const buffer = await this.reportService.generateDailyAttendanceReport(
      date,
      format,
    );

    const filename = `attendance-report-${date.toISOString().split('T')[0]}`;

    if (format === 'pdf') {
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
      });
    } else {
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      });
    }

    res.send(buffer);
  }
}
