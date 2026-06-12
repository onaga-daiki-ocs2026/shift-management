import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/api";

function ShiftSubmit() {
    const [period, setPeriod] = useState(null);
    const [shiftBlocks, setShiftBlocks] = useState([]);

    const loginUser = JSON.parse(localStorage.getItem("loginUser"));

    useEffect(() => {
        api.get("/api/submission-periods/current")
            .then((response) => {
                const data = response.data;
                setPeriod(data);

                const blocks = createShiftBlocks(data.startDate);
                setShiftBlocks(blocks);
            })
            .catch((error) => {
                console.log(error);
            });
    }, []);

    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function createShiftBlocks(startDate) {
        const blocks = [];

        const [startYear, startMonth, startDay] =
            startDate.split("-").map(Number);

        const current =
            new Date(startYear, startMonth - 1, startDay);

        for (let blockIndex = 0; blockIndex < 5; blockIndex++) {
            const blockStart = new Date(current);
            const shifts = [];

            for (let i = 0; i < 14; i++) {
                shifts.push({
                    workDate: formatDate(current),
                    available: false,
                    startTime: "",
                    endTime: "",
                });

                current.setDate(current.getDate() + 1);
            }

            const blockEnd = new Date(current);
            blockEnd.setDate(blockEnd.getDate() - 1);

            blocks.push({
                title:
                    blockIndex === 0
                        ? "提出必須期間"
                        : `追加提出期間${blockIndex}`,
                startDate: formatDate(blockStart),
                endDate: formatDate(blockEnd),
                shifts: shifts,
            });
        }

        return blocks;
    }

    function updateShift(blockIndex, shiftIndex, field, value) {
        const newBlocks = [...shiftBlocks];

        const newShifts = [...newBlocks[blockIndex].shifts];

        newShifts[shiftIndex] = {
            ...newShifts[shiftIndex],
            [field]: value,
        };

        newBlocks[blockIndex] = {
            ...newBlocks[blockIndex],
            shifts: newShifts,
        };

        setShiftBlocks(newBlocks);
    }

    function submitShift() {
        if (!loginUser) {
            alert("LINEからログインしてください");
            return;
        }

        const allShifts = shiftBlocks.flatMap((block) => block.shifts);

        const request = {
            userId: loginUser.id,
            periodId: period.id,
            requests: allShifts,
        };

        console.log("送信データ:", request);

        api.post("/api/shift-requests", request)
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
                        基準提出期間：{period.startDate}〜{period.endDate}
                    </p>

                    <p>提出可能期間：10週間分</p>

                    {shiftBlocks.map((block, blockIndex) => (
                        <div key={block.startDate}>
                            <h2>
                                {block.title}
                            </h2>

                            <p>
                                {block.startDate}〜{block.endDate}
                            </p>

                            {block.shifts.map((shift, shiftIndex) => (
                                <div
                                    className="shift-card"
                                    key={shift.workDate}
                                >
                                    <h3>{shift.workDate}</h3>

                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={shift.available}
                                            onChange={(e) =>
                                                updateShift(
                                                    blockIndex,
                                                    shiftIndex,
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
                                                blockIndex,
                                                shiftIndex,
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
                                                blockIndex,
                                                shiftIndex,
                                                "endTime",
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                            ))}
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