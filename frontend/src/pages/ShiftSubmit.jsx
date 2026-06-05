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

    function updateShift(index, field, value) {

        const newShifts = [...shifts];

        newShifts[index] = {
            ...newShifts[index],
            [field]: value,
        };

        setShifts(newShifts);
    }

    function submitShift() {

        const request = {
            periodId: period.id,
            requests: shifts,
        };

        console.log(request);

        api.post(
            "/api/shift-requests",
            request
        )
        .then(() => {
            alert("提出しました！");
        })
        .catch((error) => {
            console.log(error);
            alert("提出失敗");
        });

    }

    return (
        <Layout title="シフト提出">
        {period ? (
            <>
            <p>
                {period.startDate}〜{period.endDate}
            </p>

            <p>生成数：{shifts.length}日分</p>

            {shifts.map((shift,index) => (
                <div className="shift-card" key={shift.workDate}>
                <h3>{shift.workDate}</h3>

                <label>
                    <input
                        type="checkbox"
                        checked={shift.available}
                        onChange={(e) =>
                            updateShift(
                            index,
                            "available",
                            e.target.checked
                            )
                        }
                    />
                    出勤可能
                </label>

                <br />

                <input
                    type="time"
                    value={shift.startTime}
                    onChange={(e) =>
                        updateShift(
                        index,
                        "startTime",
                        e.target.value
                        )
                    }
                />
                〜
                <input
                    type="time"
                    value={shift.endTime}
                    onChange={(e) =>
                        updateShift(
                        index,
                        "endTime",
                        e.target.value
                        )
                    }
                />
                </div>
            ))}

            <button onClick={submitShift}>
                提出
            </button>
            </>
        ) : (
            <p>読み込み中...</p>
        )}
        </Layout>
    );
}

export default ShiftSubmit;