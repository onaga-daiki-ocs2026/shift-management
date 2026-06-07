import liff from "@line/liff";

export const initLiff = async () => {
  const liffId = import.meta.env.VITE_LIFF_ID;

  await liff.init({ liffId });

  if (liff.isLoggedIn()) {
    liff.logout();
    window.location.reload();
    return null;
  }

  liff.login();
  return null;
};