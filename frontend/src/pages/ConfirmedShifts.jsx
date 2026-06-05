import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/api";

function ConfirmedShifts() {
  const [shifts, setShifts] = useState([]);

  useEffect(() => {
    api.get("/api/confirmed-shifts")
      .then((response) => {
        console.log(response.data);
        setShifts(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  return (
    <Layout title="確定シフト確認">
      {shifts.length > 0 ? (
        <div>
          {shifts.map((shift, index) => (
            <div className="shift-card" key={index}>
              <h3>{shift.workDate}</h3>

              <p>
                {shift.name ? shift.name : `ユーザーID：${shift.userId}`}
              </p>

              <p>
                {shift.startTime}〜{shift.endTime}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p>確定シフトはありません</p>
      )}
    </Layout>
  );
}

export default ConfirmedShifts;