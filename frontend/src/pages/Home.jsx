import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import { initLiff } from "../liff/liff";

function Home() {
  const [lineUser, setLineUser] = useState(null);

  useEffect(() => {
    initLiff()
      .then((user) => {
        console.log("LINE user:", user);
        setLineUser(user);
      })
      .catch((error) => {
        console.error("LIFF error:", error);
      });
  }, []);

  return (
    <Layout title="シフト管理アプリ">

      {lineUser && (
        <div>
          <p>LINE名：{lineUser.displayName}</p>
          <p>ID：{lineUser.lineUserId}</p>
        </div>
      )}

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

        <hr />

        <Link to="/admin/shift-requests" className="menu-button">
          管理者：希望シフト一覧
        </Link>

        <Link to="/admin/confirmed-shifts/create" className="menu-button">
          管理者：確定シフト作成
        </Link>
      </div>

    </Layout>
  );
}

export default Home;