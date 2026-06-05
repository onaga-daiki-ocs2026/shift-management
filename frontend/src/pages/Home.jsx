import { useEffect, useState } from "react";
import api from "../api/api";

function Home() {

    const [period, setPeriod] = useState(null);

    useEffect(() => {

        api.get("/api/submission-periods/current")
            .then(response => {
                console.log(response.data);
                setPeriod(response.data);
            })
            .catch(error => {
                console.log(error);
            });

    }, []);

    return (
        <div>
            <h1>シフト管理アプリ</h1>

            {period ? (
                <>
                    <p>
                        {period.startDate}
                        〜
                        {period.endDate}
                    </p>

                    <p>
                        締切：{period.deadline}
                    </p>
                </>
            ) : (
                <p>読み込み中...</p>
            )}

        </div>
    );
}

export default Home;