package com.shift.shift_management.controller;

import com.shift.shift_management.entity.User;
import com.shift.shift_management.service.ShiftPdfService;
import com.shift.shift_management.service.SubmissionPeriodService;
import com.shift.shift_management.service.UserService;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
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
	private final UserService userService;

	// PDFアップロード（ADMINのみ）
	@PostMapping("/upload")
	public ResponseEntity<Map<String, String>> uploadPdf(
			@RequestParam("file") MultipartFile file,
			@RequestParam("periodStart")
			@DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodStart,
			@RequestHeader(value = "X-Line-User-Id", required = false) String callerLineUserId)
			throws IOException {

		User caller = userService.requireAdmin(callerLineUserId);
		String url = shiftPdfService.uploadPdf(file, periodStart, caller.getDisplayName());
		return ResponseEntity.ok(Map.of("url", url));
	}

	// 現在の期間のPDF URLを取得（対象期間の開始日・終了日つき）
	@GetMapping("/current")
	public ResponseEntity<Map<String, String>> getCurrentPdf() {
		var period = submissionPeriodService.getCurrentPeriod();
		LocalDate periodStart = period.startDate();
		LocalDate periodEnd = period.endDate();
		String url = shiftPdfService.getCurrentPdfUrl(periodStart);

		if (url == null) {
			return ResponseEntity.ok(
					Map.of(
							"url", "",
							"periodStart", periodStart.toString(),
							"periodEnd", periodEnd.toString()));
		}
		return ResponseEntity.ok(
				Map.of(
						"url", url,
						"periodStart", periodStart.toString(),
						"periodEnd", periodEnd.toString()));
	}

	// 公開済みPDFのうち、直近5件を新しい順に一覧取得
	@GetMapping("/all")
	public ResponseEntity<List<ShiftPdfListItem>> getAllPdfs() {
		List<ShiftPdfListItem> list =
				shiftPdfService.findRecentPdfs().stream()
						.map(
								pdf ->
										new ShiftPdfListItem(
												pdf.getPeriodStart().toString(),
												pdf.getPeriodStart().plusDays(13).toString(),
												pdf.getPdfUrl()))
						.toList();
		return ResponseEntity.ok(list);
	}

	public record ShiftPdfListItem(String periodStart, String periodEnd, String url) {}
}