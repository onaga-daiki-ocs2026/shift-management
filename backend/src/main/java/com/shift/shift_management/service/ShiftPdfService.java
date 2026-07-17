package com.shift.shift_management.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.shift.shift_management.entity.ShiftPdf;
import com.shift.shift_management.entity.User;
import com.shift.shift_management.repository.ShiftPdfRepository;
import com.shift.shift_management.repository.UserRepository;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@RequiredArgsConstructor
@Service
public class ShiftPdfService {

	private static final DateTimeFormatter DATE_FORMAT =
			DateTimeFormatter.ofPattern("M月d日");

	private final ShiftPdfRepository shiftPdfRepository;
	private final Cloudinary cloudinary;
	private final UserRepository userRepository;
	private final LineNotificationService lineNotificationService;

	public String uploadPdf(MultipartFile file, LocalDate periodStart) throws IOException {

		// 既存のPDFがあれば古いものをCloudinaryから削除
		Optional<ShiftPdf> existing = shiftPdfRepository.findByPeriodStart(periodStart);
		if (existing.isPresent() && existing.get().getCloudinaryPublicId() != null) {
			cloudinary.uploader().destroy(
					existing.get().getCloudinaryPublicId(),
					ObjectUtils.asMap("resource_type", "raw"));
		}

		// Cloudinaryにアップロード
		Map uploadResult = cloudinary.uploader().upload(
				file.getBytes(),
				ObjectUtils.asMap(
					"resource_type", "raw",
					"folder", "shift-pdfs",
					"type", "upload",
					"format", "pdf",
					"access_mode", "public"
				));

		String pdfUrl = (String) uploadResult.get("secure_url");
		String publicId = (String) uploadResult.get("public_id");

		// DBに保存（上書き）
		ShiftPdf shiftPdf = existing.orElseGet(ShiftPdf::new);
		shiftPdf.setPeriodStart(periodStart);
		shiftPdf.setPdfUrl(pdfUrl);
		shiftPdf.setCloudinaryPublicId(publicId);
		shiftPdfRepository.save(shiftPdf);

		// シフト確定をLINEで全スタッフに通知（対象期間つき）
		notifyStaffShiftConfirmed(periodStart);

		return pdfUrl;
	}

	public String getCurrentPdfUrl(LocalDate periodStart) {
		return shiftPdfRepository
				.findByPeriodStart(periodStart)
				.map(ShiftPdf::getPdfUrl)
				.orElse(null);
	}

	private void notifyStaffShiftConfirmed(LocalDate periodStart) {
		// 確定シフト作成画面は14日分をまとめて扱うため、期間終了日は開始日+13日
		LocalDate periodEnd = periodStart.plusDays(13);

		String message =
				"📋 " + periodStart.format(DATE_FORMAT) + "から"
						+ periodEnd.format(DATE_FORMAT) + "のシフトを公開しました。\n"
						+ "アプリの「確定シフト確認」からご確認ください。";

		userRepository.findAll().stream()
				.filter(user -> "STAFF".equals(user.getRole()))
				.forEach(user -> lineNotificationService.push(user.getLineUserId(), message));
	}
}