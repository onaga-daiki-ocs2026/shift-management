import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import { initLiff } from "../liff/liff";
import api from "../api/api";

function Home() {
  const [loginUser, setLoginUser] = useState(null);

  useEffect(() => {
    const login = async () => {
      try {
        const lineUser = await initLiff();

        if (!lineUser) {
          return;
        }

        const response = await api.post("/api/users/login", {
          lineUserId: lineUser.lineUserId,
          displayName: lineUser.displayName,
        });

        localStorage.setItem("loginUser", JSON.stringify(response.data));
        setLoginUser(response.data);
      } catch (error) {
        console.error(error);
      }
    };

    login();
  }, []);

  return (
    <Layout title="シフト管理アプリ">
      <div className="menu">
        <Link to="/submit" className="menu-button">
          シフト提出
        </Link>

        <Link to="/my-submissions" className="menu-button">
          提出済み確認
        </Link>

        <Link to="/confirmed-shifts" className="menu-button">
          確定シフト確認
        </Link>

        {loginUser?.role === "ADMIN" && (
          <>
            <hr />

            <Link to="/admin/shift-requests" className="menu-button">
              管理者：希望シフト一覧
            </Link>

            <Link to="/admin/confirmed-shifts/create" className="menu-button">
              管理者：確定シフト作成
            </Link>
          </>
        )}
      </div>
    </Layout>
  );
}

export default Home;