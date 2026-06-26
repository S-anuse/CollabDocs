import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const { accessToken, user } = useContext(AuthContext);

  const [documents, setDocuments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [search, setSearch] = useState("");

  const stripHtml = (html) => {
    if (!html || typeof html !== "string") return "";
    return html
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await api.get("/documents", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        setDocuments(response.data.combinedDocumentId);
      } catch (err) {
        console.log(err);
      }
    };

    if (accessToken) {
      fetchDocuments();
    }
  }, [accessToken]);

  const createDocument = async () => {
    try {
      const response = await api.post(
        "/documents",
        {
          title: "Untitled Document",
          content: "",
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      navigate(`/editor/${response.data.document._id}`);
    } catch (err) {
      console.log(err);
    }
  };

  const deleteDocument = async (documentId) => {
    try {
      await api.delete("/documents/" + documentId, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setDocuments(documents.filter((doc) => doc._id !== documentId));
    } catch (err) {
      console.log(err);
    }
  };

  const renameDocument = async (documentId, content) => {
    try {
      await api.put(
        "/documents/" + documentId,
        {
          title: newTitle,
          content: content,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      setDocuments(
        documents.map((doc) =>
          doc._id === documentId ? { ...doc, title: newTitle } : doc,
        ),
      );

      setEditingId(null);
    } catch (err) {
      console.log(err);
    }
  };

  const filteredDocuments = (documents || []).filter((doc) =>
    doc && typeof doc.title === "string" && doc.title.toLowerCase().includes(search.toLowerCase())
  );

    const getPermissionBadge = (perm) => {
      switch (perm) {
        case "owner":
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              👑 Owner
            </span>
          );
        case "editor":
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              ✏ Editor
            </span>
          );
        case "viewer":
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              👁 Viewer
            </span>
          );
        default:
          return null;
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 p-6">
        <div className="mb-10">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-blue-600 font-semibold uppercase tracking-widest">
                Welcome Back
              </p>
  
              <h1 className="text-5xl font-extrabold text-gray-800 mt-2">
                Hi, {user?.name} 👋
              </h1>
  
              <p className="text-gray-500 mt-3 text-lg">
                Manage, edit and collaborate on your documents.
              </p>
            </div>
  
            <div className="hidden md:flex">
              <div className="bg-white rounded-3xl shadow-xl px-8 py-6">
                <div className="text-5xl">📄</div>
              </div>
            </div>
          </div>
        </div>
  
        <div className="flex flex-col md:flex-row gap-5 mb-10">
          {/* Search Box */}
  
          <div className="flex-1 relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
              🔍
            </span>
  
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your documents..."
              className="w-full pl-14 pr-5 py-4 rounded-2xl bg-white/80 backdrop-blur-xl shadow-lg border border-white outline-none focus:ring-4 focus:ring-blue-200 transition-all  duration-300"
            />
          </div>
  
          {/* Create Button */}
  
          <button
            onClick={createDocument}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300"
          >
            ✨ New Document
          </button>
        </div>
  
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-white">
          {(documents || []).length === 0 ? (
            <div className="text-center py-24">
              <div className="text-8xl mb-6">📄</div>
  
              <h2 className="text-3xl font-bold text-gray-700">
                No Documents Yet
              </h2>
  
              <p className="text-gray-500 mt-3">
                Create your first document to get started.
              </p>
  
              <button
                onClick={createDocument}
                className="mt-8 px-8 py-4 rounded-2xl bg-blue-600 text-white hover:scale-105 transition"
              >
                ✨ Create First Document
              </button>
            </div>
          ) : (
            filteredDocuments.map((doc) => (
              <div
                key={doc._id}
                onClick={() => navigate(`/editor/${doc._id}`)}
                className="group bg-white rounded-3xl p-6 mb-6 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-transparent hover:border-blue-300"
              >
                {/* Top */}
  
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl shadow-lg">
                      📄
                    </div>
  
                    <div>
                      {editingId === doc._id ? (
                        <div className="flex gap-3">
                          <input
                            value={newTitle}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="border-2 border-blue-400 rounded-xl px-3 py-2 outline-none"
                          />
  
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              renameDocument(doc._id, doc.content);
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white px-5 rounded-xl"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-2xl font-bold text-gray-800">
                              {doc.title}
                            </h2>
                            {getPermissionBadge(doc.permission)}
                          </div>
  
                          <p className="text-gray-500 mt-2 line-clamp-2">
                            {stripHtml(doc.content).slice(0, 150)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
  
                  <div className="text-3xl opacity-30 group-hover:opacity-100 transition">
                    📑
                  </div>
                </div>
  
                {/* Bottom */}
  
                <div className="mt-6 flex justify-between items-center">
                  <p className="text-gray-400 text-sm">
                    Updated {doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : "N/A"}
                  </p>
  
                  <div className="flex gap-3">
                    {doc.permission !== "viewer" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(doc._id);
                          setNewTitle(doc.title);
                        }}
                        className="px-5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-white font-semibold transition"
                      >
                        ✏ Rename
                      </button>
                    )}
  
                    {(!doc.permission || doc.permission === "owner") && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDocument(doc._id);
                        }}
                        className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition"
                      >
                        🗑 Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
}

export default Dashboard;
