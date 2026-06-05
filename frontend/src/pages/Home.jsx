import { useEffect, useState } from "react";
import api from "../api/api";

function Home() {
    const [period, setPeriod] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        api.get("/api/submission-periods/current")
            .then(response => {
                console.log(response.data);
                setPeriod(response.data);
            })
            .catch(error => {
                console.log(error);
                setError("API取得に失敗しました");
            });
    }, []);

    return (
        <div>
            <h1>シフト管理アプリ</h1>

            {error && <p>{error}</p>}

            {period ? (
                <>
                    <p>{period.startDate}〜{period.endDate}</p>
                    <p>締切：{period.deadline}</p>
                </>
            ) : (
                !error && <p>読み込み中...</p>
            )}
        </div>
    );
}

export default Home;