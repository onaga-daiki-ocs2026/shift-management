package com.shift.shift_management.controller;

import com.shift.shift_management.service.ShiftPdfService;
import com.shift.shift_management.service.SubmissionPeriodService;
import java.io.IOException;
import java.time.LocalDate;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/pdfs")
public class ShiftPdfController {

	private final ShiftPdfService shiftPdfService;
	private final SubmissionPeriodService submissionPeriodService;

	// PDFアップロード
	@PostMapping("/upload")
	public ResponseEntity<Map<String, String>> uploadPdf(
			@RequestParam("file") MultipartFile file,
			@RequestParam("periodStart")
			@DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodStart)
			throws IOException {

		String url = shiftPdfService.uploadPdf(file, periodStart);
		return ResponseEntity.ok(Map.of("url", url));
	}

	// 現在の期間のPDF URLを取得
	@GetMapping("/current")
	public ResponseEntity<Map<String, String>> getCurrentPdf() {
		var period = submissionPeriodService.getCurrentPeriod();
		LocalDate periodStart = period.startDate();
		String url = shiftPdfService.getCurrentPdfUrl(periodStart);

		if (url == null) {
			return ResponseEntity.ok(Map.of("url", ""));
		}
		return ResponseEntity.ok(Map.of("url", url));
	}
}