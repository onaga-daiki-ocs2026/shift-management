import liff from "@line/liff";

export const initLiff = async () => {
  console.log("LIFF開始");

  const liffId = import.meta.env.VITE_LIFF_ID;
  console.log("LIFF ID:", liffId);

  await liff.init({ liffId });

  console.log("LIFF初期化成功");
  console.log("ログイン状態:", liff.isLoggedIn());

  if (!liff.isLoggedIn()) {
    liff.login();
    return null;
  }

  const profile = await liff.getProfile();

  console.log("プロフィール:", profile);

  return {
    lineUserId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
  };
};