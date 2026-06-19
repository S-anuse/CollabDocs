import { useEffect, useState, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import api from "../api/axios";
import {Bold ,Italic ,List ,Heading1 ,Heading2 ,Undo2 ,Redo2} from "lucide-react";
import "../styles/editor.css";

function Editor() {

  const [document, setDocument] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState("Saved");
  const timerRef = useRef(null);
  const isInitialLoad = useRef(true);
  const { accessToken } = useContext(AuthContext);
  const { id } = useParams() ;

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
  });

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

      setSaveStatus("Saved");
    } 
    catch (err) {
      console.log(err);
      setSaveStatus("Error");
    }
  };

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
  }, [id, accessToken]) ;

  useEffect(() => {
    if (editor && document) {
      editor.commands.setContent(document.content);
    }
  }, [editor, document]);


  useEffect(() => {
    if (!document) return;

    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    setSaveStatus("Saving...");

    clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      saveDocument();
    }, 2000);

    return () => clearTimeout(timerRef.current);
  }, [content, title]);


  if (!document) {
    return <h1>Loading...</h1>;
  }


  return (
    <div className="min-h-screen bg-[#f1f3f4]">

  {/* Top Bar */}

  <div className="h-16 bg-white border-b flex items-center justify-between px-6">

    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
  <span className="text-2xl">📄</span>
  <span className="text-xl font-semibold text-blue-600">
    CollabDocs
  </span>
</div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-lg font-normal outline-none px-2 py-1 rounded hover:bg-gray-100"
      />
    </div>

    <div className="flex items-center gap-6">

      <div className="text-sm text-gray-500">
  {saveStatus === "Saved" ? "✓ Saved" : saveStatus}
</div>

      <button className="bg-blue-500 text-white px-4 py-2 rounded-full">
        Share
      </button>

    </div>

  </div>

  {/* Toolbar */}

  <div className="bg-[#f1f3f4] px-6 py-3">
  <div className="bg-white rounded-full shadow-sm px-4 py-2 flex gap-2 items-center mx-auto w-fit">

    <button
    className={`p-2 rounded-md hover:bg-gray-200 ${
    editor?.isActive("bold")
      ? "bg-blue-100 text-blue-600"
      : ""
  }`}
  onClick={() =>
    editor?.chain().focus().toggleBold().run()
  }
>
  <Bold size={18} />
</button>
<button
className={`p-2 rounded-md hover:bg-gray-200 ${
    editor?.isActive("italic")
      ? "bg-blue-100 text-blue-600"
      : ""
  }`}
  onClick={() =>
    editor?.chain().focus().toggleItalic().run()
  }
>
  <Italic size={18} />
</button>

<div className="w-px h-6 bg-gray-300 mx-2" />
<button
className={`p-2 rounded-md hover:bg-gray-200 ${
    editor?.isActive("heading", { level: 1 })
      ? "bg-blue-100 text-blue-600"
      : ""
  }`}
  onClick={() =>
    editor?.chain().focus().toggleHeading({ level: 1 }).run()
  }
>
  <Heading1 size={18} />
</button>
<button
className={`p-2 rounded-md hover:bg-gray-200 ${
    editor?.isActive("heading", { level: 2 })
      ? "bg-blue-100 text-blue-600"
      : ""
  }`}
  onClick={() =>
    editor?.chain().focus().toggleHeading({ level: 2 }).run()
  }
>
  <Heading2 size={18} />
</button>

<div className="w-px h-6 bg-gray-300 mx-2" />
<button
className={`p-2 rounded-md hover:bg-gray-200 ${
    editor?.isActive("bulletList")
      ? "bg-blue-100 text-blue-600"
      : ""
  }`}
  onClick={() =>
    editor?.chain().focus().toggleBulletList().run()
  }
>
  <List size={18} />
</button>
<div className="w-px h-6 bg-gray-300 mx-2" />
<button
className="p-2 rounded-md hover:bg-gray-200"
  onClick={() =>
    editor?.chain().focus().undo().run()
  }
>
  <Undo2 size={18} />
</button>
<button
className="p-2 rounded-md hover:bg-gray-200"
  onClick={() =>
    editor?.chain().focus().redo().run()
  }
>
  <Redo2 size={18} />
</button>

  </div>

  {/* Page */}

  <div className="flex justify-center py-10">

      <div className="bg-white w-[816px] min-h-[1100px] shadow-lg border border-gray-200 p-20">

    <div className="prose max-w-none text-lg leading-8">
  <EditorContent editor={editor} />
</div>

</div>

  </div>

</div>
</div>
  ) ;
}

export default Editor ;