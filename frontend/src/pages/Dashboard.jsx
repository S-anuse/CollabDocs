import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const {accessToken , user } = useContext(AuthContext);

  const [documents, setDocuments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [search, setSearch] = useState("");

  const stripHtml = (html) => {
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
      } 
      catch (err) {
        console.log(err);
      }
    };

    if (accessToken) {
      fetchDocuments();
    }
  }, [accessToken]);



  const createDocument = async () => {
    try {
      const response = await api.post("/documents", {
                                      title: "Untitled Document",
                                      content: "", } , {
                                      headers: {
                                      Authorization: `Bearer ${accessToken}`, } , }
      );

      navigate(`/editor/${response.data.document._id}`);
      }
      catch (err) {
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

      setDocuments(
        documents.filter(
          (doc) => doc._id !== documentId
        )
      );
    } 
    catch (err) {
      console.log(err);
    }
  };


  const renameDocument = async (documentId, content) => {
    try {
      await api.put("/documents/" + documentId,
        {
          title: newTitle,
          content: content,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setDocuments(
        documents.map((doc) =>
          doc._id === documentId
            ? { ...doc, title: newTitle }
            : doc
        )
      );

      setEditingId(null);
    } 
    catch (err) {
      console.log(err);
    }
  };

  const filteredDocuments = documents.filter((doc) => doc.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-100 p-6">

      <h1 className="text-3xl font-bold mb-6">
        Hi {user?.name} 👋
      </h1>

      <div className="flex gap-4 mb-6">

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Documents"
          className="flex-1 border rounded-lg px-4 py-2"
        />

        <button onClick={createDocument} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          New Document
        </button>

      </div>

      <div className="bg-white rounded-lg p-6 shadow">

        {documents.length === 0 ? (<h2>No Documents Yet</h2>) : (
          filteredDocuments.map((doc) => (
          <div key={doc._id} onClick={() => navigate(`/editor/${doc._id}`)} className="border rounded-lg p-4 mb-3 bg-white cursor-pointer hover:bg-slate-50">
            {editingId === doc._id ? (<>
                <input  value={newTitle}  onChange={(e) => setNewTitle(e.target.value)}  onClick={(e) => e.stopPropagation()}  className="border rounded px-2 py-1" />
                <button  onClick={(e) => {
                          e.stopPropagation();
                          renameDocument(doc._id, doc.content);
                        }}  className="bg-green-500 text-white px-3 py-1 rounded ml-2">
                    Save
                </button>
              </>) : 
              (<h3 className="font-semibold">
                  {doc.title}
                </h3>
              )
            }
          
          <p className="text-gray-500 line-clamp-2">
            {stripHtml(doc.content).slice(0,120)}
          </p>
          <button  onClick={(e) => {
              e.stopPropagation();
              deleteDocument(doc._id);
            }} className="bg-red-500 text-white px-3 py-1 rounded">
            Delete
          </button>
          <button  onClick={(e) => {
              e.stopPropagation();
              setEditingId(doc._id);
              setNewTitle(doc.title);
            }} className="bg-yellow-500 text-white px-3 py-1 rounded">
            Rename
          </button>
      </div>
      ))
    )
        }

      </div>

    </div>
  );
}

export default Dashboard;