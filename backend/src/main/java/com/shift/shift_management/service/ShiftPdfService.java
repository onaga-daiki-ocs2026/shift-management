package com.shift.shift_management.service;

import com.shift.shift_management.entity.ShiftPdf;
import com.shift.shift_management.entity.User;
import com.shift.shift_management.repository.ShiftPdfRepository;
import com.shift.shift_management.repository.UserRepository;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
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
	private final SupabaseStorageService supabaseStorageService;
	private final UserRepository userRepository;
	private final LineNotificationService lineNotificationService;

	public String uploadPdf(MultipartFile file, LocalDate periodStart) throws IOException {

		// 期間の開始日をファイル名にすることで、
		// 同じ期間のPDFは常に同じパスに上書き保存される。
		// 期間が違えば別ファイルとして追加保存される。
		String objectPath = periodStart.toString() + ".pdf";

		String pdfUrl = supabaseStorageService.upload(file.getBytes(), objectPath);

		// 同じ期間（periodStart）のレコードがあれば更新、無ければ新規追加
		Optional<ShiftPdf> existing = shiftPdfRepository.findByPeriodStart(periodStart);
		ShiftPdf shiftPdf = existing.orElseGet(ShiftPdf::new);
		shiftPdf.setPeriodStart(periodStart);
		shiftPdf.setPdfUrl(pdfUrl);
		// 既存カラムをそのまま「保存先パス」として流用（DBスキーマ変更なしで済ませるため）
		shiftPdf.setCloudinaryPublicId(objectPath);
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

	// 公開済みのPDFを、新しい期間の順に直近5件だけ一覧取得
	// （5件より前のものはDBには残っているが、ここでは返さない）
	public List<ShiftPdf> findRecentPdfs() {
		return shiftPdfRepository.findTop5ByOrderByPeriodStartDesc();
	}

	private void notifyStaffShiftConfirmed(LocalDate periodStart) {
		LocalDate periodEnd = periodStart.plusDays(13);

		String message =
				"📋 " + periodStart.format(DATE_FORMAT) + "から"
						+ periodEnd.format(DATE_FORMAT) + "のシフトを公開しました。\n"
						+ "アプリの「確定シフト確認」からご確認ください。";

		// STAFF/ADMIN問わず、LINE連携しているユーザー全員に通知する
		userRepository.findAll()
				.forEach(user -> lineNotificationService.push(user.getLineUserId(), message));
	}
}