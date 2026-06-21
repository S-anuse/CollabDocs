import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";

function ShareModal({ documentId, onClose }) {
  const { accessToken } = useContext(AuthContext);
  const [sharedUsers, setSharedUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("viewer");
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (accessToken) {
      sharedUsersfunc();
    }
  }, [accessToken, documentId]);

  const sharedUsersfunc = async () => {
    try {
      const response = await api.get("/shared-users/" + documentId, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log(response.data);
      setSharedUsers(response.data);
    } catch (err) {
      console.log(err);
    }
  };

  const share = async () => {
    try {
      setSharing(true);
      await api.post(
        "/share",
        {
          documentId,
          email,
          permission,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      await sharedUsersfunc();
      setEmail("");
      setPermission("viewer");
    } catch (err) {
      console.log(err);
    } finally {
      setSharing(false);
    }
  };

  const removeaccessfunc = async (userId) => {
    try {
      await api.delete("/remove-access/" + documentId, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: {
          userId,
        },
      });

      await sharedUsersfunc();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[600px] rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h2 className="text-2xl font-semibold">Share Document</h2>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-xl"
          >
            ✕
          </button>
        </div>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address"
          className="w-full border rounded-lg px-4 py-3 mt-4 outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={permission}
          onChange={(e) => setPermission(e.target.value)}
          className="w-full border rounded-lg px-4 py-3 mt-3"
        >
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
        </select>

        <button
          disabled={!email || sharing}
          onClick={share}
          className="mt-4
    w-full
    bg-blue-600
    text-white
    py-3
    rounded-lg
    hover:bg-blue-700
    disabled:bg-gray-300
  "
        >
          {sharing ? "Sharing..." : "Share Document"}
        </button>

        <div className="mt-6 max-h-72 overflow-y-auto">
          <h3 className="font-semibold text-lg mb-3">Shared Users</h3>

          {sharedUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-6">
              No shared users yet
            </p>
          ) : (
            sharedUsers.map((user) => (
              <div
                key={user.userId}
                className="
          border
          rounded-xl
          p-4
          flex
          justify-between
          items-center
          mb-3
        "
              >
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-gray-500 text-sm">{user.email}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={
                      user.permission === "editor"
                        ? "bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm"
                        : "bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                    }
                  >
                    {user.permission}
                  </span>

                  <button
                    onClick={() => removeaccessfunc(user.userId)}
                    className="
              bg-red-500
              text-white
              px-3
              py-1
              rounded-lg
              hover:bg-red-600
            "
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
