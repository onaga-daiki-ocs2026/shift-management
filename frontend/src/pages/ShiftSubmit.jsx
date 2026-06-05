import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/api";

function ShiftSubmit() {
    const [period, setPeriod] = useState(null);
    const [shifts, setShifts] = useState([]);

    useEffect(() => {
        api.get("/api/submission-periods/current")
        .then((response) => {
            console.log(response.data);

            const data = response.data;

            setPeriod(data);

            const dates = createDates(data.startDate, data.endDate);

            console.log("startDate:", data.startDate);
            console.log("endDate:", data.endDate);
            console.log("dates:", dates);

            setShifts(
                dates.map((date) => ({
                    workDate: date,
                    available: false,
                    startTime: "",
                    endTime: "",
                }))
            );
        })
        .catch((error) => {
            console.log(error);
        });
    }, []);

    function createDates(start, end) {
        const list = [];

        const [startYear, startMonth, startDay] = start.split("-").map(Number);
        const [endYear, endMonth, endDay] = end.split("-").map(Number);

        const current = new Date(startYear, startMonth - 1, startDay);
        const last = new Date(endYear, endMonth - 1, endDay);

        while (current <= last) {
            const year = current.getFullYear();
            const month = String(current.getMonth() + 1).padStart(2, "0");
            const day = String(current.getDate()).padStart(2, "0");

            list.push(`${year}-${month}-${day}`);

            current.setDate(current.getDate() + 1);
        }

        return list;
    }

    return (
        <Layout title="シフト提出">
        {period ? (
            <>
            <p>
                {period.startDate}〜{period.endDate}
            </p>

            <p>生成数：{shifts.length}日分</p>

            {shifts.map((shift) => (
                <div className="shift-card" key={shift.workDate}>
                <h3>{shift.workDate}</h3>

                <label>
                    <input type="checkbox" />
                    出勤可能
                </label>

                <br />

                <input type="time" />
                〜
                <input type="time" />
                </div>
            ))}

            <button>提出</button>
            </>
        ) : (
            <p>読み込み中...</p>
        )}
        </Layout>
    );
}

export default ShiftSubmit;