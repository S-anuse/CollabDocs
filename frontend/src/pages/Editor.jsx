import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";

function Editor() {

  const [document, setDocument] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { accessToken } = useContext(AuthContext);
  const { id } = useParams() ;

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await api.get("/documents/"+id, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        setDocument(response.data.document);
        setTitle(response.data.document.title);
        setContent(response.data.document.content);
      } 
      catch (err) {
        console.log(err);
      }
    };

    if (accessToken) {
      fetchDocuments();
    }
  }, [id, accessToken])

  if (!document) {
    return <h1>Loading...</h1>;
  }


  const saveDocument = async () => {
    try {
      await api.put("/documents/" + id,
        {
          title,
          content,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      alert("Document Saved");
    } 
    catch (err) {
      console.log(err);
    }
  };
  

  return (
    <div className="min-h-screen bg-slate-100 p-6">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-3xl font-bold mb-4 p-2 border rounded-lg"/>
        <textarea value={content}  onChange={(e) => setContent(e.target.value)} className="w-full h-[500px] p-4 border rounded-lg bg-white"/>
          <button  onClick={saveDocument}  className="bg-blue-600 text-white px-4 py-2 rounded-lg">
              Save
          </button>
    </div>
  ) ;
}

export default Editor ;