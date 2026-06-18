import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

function Dashboard() {
  const { accessToken, user } = useContext(AuthContext);

  console.log(accessToken);
  console.log(user);

  return (
    <div>
      <h1>Hi {user.name} 👋</h1>
    </div>
  );
}

export default Dashboard;