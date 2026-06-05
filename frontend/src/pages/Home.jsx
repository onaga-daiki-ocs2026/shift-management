import Layout from "../components/Layout";

function Home() {
  return (
    <Layout title="シフト管理アプリ">
      <div className="menu">
        <a href="/submit" className="menu-button">
          シフト提出
        </a>

        <a href="/my-submissions" className="menu-button">
          提出済み確認
        </a>

        <a href="/confirmed-shifts" className="menu-button">
          確定シフト確認
        </a>
      </div>
    </Layout>
  );
}

export default Home;