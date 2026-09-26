import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";

function VersionModal({ documentId, onClose, onRestore }) {
  const { accessToken } = useContext(AuthContext);
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);

  useEffect(() => {
    if (accessToken) {
      fetchVersions();
    }
  }, [accessToken, documentId]);

  const fetchVersions = async () => {
    try {
      const response = await api.get("/versions/" + documentId, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log("VERSIONS RESPONSE:", response.data);
      setVersions(response.data);
    } catch (err) {
      console.log(err);
    }
  };

  const restoreVersion = async () => {
    try {
      await api.post(
        "/restore-version/" + documentId,
        {
          versionId: selectedVersion._id,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      await onRestore();

      onClose();
    } catch (err) {
      console.log(err);
    }
  };

  console.log("VersionModal Rendered");
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[600px] rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h1 className="text-2xl font-semibold">Version History</h1>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-xl"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-2">Total session checkpoints: {versions.length}</p>
        <div className="mt-4 max-h-72 overflow-y-auto space-y-2">
          {versions.map((version) => (
            <div
              key={version._id}
              onClick={() => setSelectedVersion(version)}
              className={`border rounded-xl p-3 cursor-pointer transition ${
                selectedVersion?._id === version._id
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "hover:bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex justify-between items-center">
                <p className="font-semibold text-gray-800 text-sm">
                  {version.title || "Untitled Document"}
                </p>
                <span className="text-xs text-gray-500">
                  {new Date(version.updatedAt || version.createdAt).toLocaleString()}
                </span>
              </div>
              {version.authorId && (
                <p className="text-xs text-blue-600 mt-1 font-medium">
                  ✏ Edited by {version.authorId.name || version.authorId.email}
                </p>
              )}
            </div>
          ))}
        </div>
        {selectedVersion && (
          <div className="mt-4 border-t pt-4">
            <h2 className="font-semibold">{selectedVersion.title}</h2>

            <div
              dangerouslySetInnerHTML={{
                __html: selectedVersion.content,
              }}
            />
            <button
              onClick={restoreVersion}
              className="
    mt-4
    bg-blue-600
    text-white
    px-4
    py-2
    rounded-lg
    hover:bg-blue-700
  "
            >
              Restore Version
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default VersionModal;
