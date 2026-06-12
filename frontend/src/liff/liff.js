import liff from "@line/liff";

export const initLiff = async () => {
	const liffId = import.meta.env.VITE_LIFF_ID;

	await liff.init({ liffId });

	if (!liff.isLoggedIn()) {
		liff.login();
		return null;
	}

	const profile = await liff.getProfile();

	return {
		lineUserId: profile.userId,
		displayName: profile.displayName,
		pictureUrl: profile.pictureUrl,
	};
};
