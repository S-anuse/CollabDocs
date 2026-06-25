import { useEffect, useState, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import api from "../api/axios";
import {
  Bold,
  Italic,
  List,
  Heading1,
  Heading2,
  Undo2,
  Redo2,
  ImageIcon,
} from "lucide-react";
import "../styles/editor.css";
import socket from "../socket";
import ShareModal from "../components/ShareModal";
import VersionModal from "../components/VersionModal";

function Editor() {
  const [document, setDocument] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const timerRef = useRef(null);
  const isInitialLoad = useRef(true);
  const isRemoteUpdate = useRef(false);
  const fileInputRef = useRef(null);
  const { accessToken } = useContext(AuthContext);
  const { id } = useParams();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.extend({
        selectable: true,
      }).configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      console.log("EDITOR UPDATED");
      console.log(editor.getHTML());
      if (isRemoteUpdate.current) {
        isRemoteUpdate.current = false;
        return;
      }
      const html = editor.getHTML();

      setContent(html);

      socket.emit("send-changes", {
        documentId: id,
        content: html,
      });
    },
  });

  const saveDocument = async () => {
    console.log("SAVE DOCUMENT CALLED");
    console.log(content);
    try {
      await api.put(
        "/documents/" + id,
        {
          title,
          content,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      setSaveStatus("Saved");
    } catch (err) {
      console.log(err);
      setSaveStatus("Error");
    }
  };

  const uploadImage = async (file) => {
    try {
      const formData = new FormData();

      formData.append("image", file);

      const response = await api.post("/upload-image", formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data.imageUrl;
    } catch (err) {
      console.log(err);
    }
  };

  const handleImageSelect = async (e) => {
    console.log("Image selected");

    const file = e.target.files[0];

    console.log(file);

    if (!file) return;

    const imageUrl = await uploadImage(file);

    console.log("Returned URL:", imageUrl);

    if (!imageUrl) return;

    editor
      ?.chain()
      .focus()
      .insertContent([
        {
          type: "image",
          attrs: {
            src: imageUrl,
          },
        },
        {
          type: "paragraph",
        },
      ])
      .run();

    // Force React state to update
    const html = editor.getHTML();
    setContent(html);

    console.log("AFTER INSERT:");
    console.log(html);
  };

  const fetchDocuments = async () => {
    try {
      const response = await api.get("/documents/" + id, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setDocument(response.data.document);
      setTitle(response.data.document.title);
      setContent(response.data.document.content);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchDocuments();
    }
  }, [id, accessToken]);

  useEffect(() => {
    if (editor && document) {
      console.log("SETTING CONTENT");
      console.log(document.content);

      isRemoteUpdate.current = true;
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

  useEffect(() => {
    if (!socket.connected) socket.connect();

    const handleConnect = () => {
      socket.emit("join-document", id);
    };

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    if (!editor) return;

    const handler = (content) => {
      isRemoteUpdate.current = true;
      editor.commands.setContent(content);
    };

    socket.on("receive-changes", handler);

    return () => {
      socket.off("receive-changes", handler);
    };
  }, [editor]);

  if (!document) {
    return <h1>Loading...</h1>;
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br
from-slate-100
via-blue-50
to-indigo-100"
    >
      {/* Top Bar */}

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleImageSelect}
      />

      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200 shadow-md flex items-center justify-between px-8 h-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white text-2xl shadow-lg">
              📄
            </div>

            <div>
              <h1 className="text-xl font-bold text-gray-800">CollabDocs</h1>

              <p className="text-xs text-gray-500">Collaborative Workspace</p>
            </div>
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-normal outline-none px-2 py-1 rounded hover:bg-gray-100"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>

            <span className="text-green-700 font-medium text-sm">
              {saveStatus}
            </span>
          </div>

          <button
            className="px-5 py-2 rounded-full bg-white border border-gray-300 hover:bg-gray-100 transition"
            onClick={() => setShowVersions(true)}
          >
            🕒 Version History
          </button>

          <button
            className="px-5 py-2 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition"
            onClick={() => setShowShareModal(true)}
          >
            👥 Share
          </button>
        </div>
      </div>

      {/* Toolbar */}

      <div className="px-6 pt-6">
        <div className="sticky top-24 z-40 mx-auto w-fit flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-2xl">
          <button
            className={`p-3 rounded-xl transition-all duration-200 hover:bg-blue-100 hover:text-blue-600 hover:scale-110 ${
              editor?.isActive("bold") ? "bg-blue-100 text-blue-600" : ""
            }`}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold size={20} />
          </button>

          <button
            className={`p-3 rounded-xl transition-all duration-200 hover:bg-blue-100 hover:text-blue-600 hover:scale-110 ${
              editor?.isActive("italic") ? "bg-blue-100 text-blue-600" : ""
            }`}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic size={20} />
          </button>

          <div className="w-px h-7 bg-gray-300 mx-1" />

          <button
            className={`p-3 rounded-xl transition-all duration-200 hover:bg-blue-100 hover:text-blue-600 hover:scale-110 ${
              editor?.isActive("heading", { level: 1 })
                ? "bg-blue-100 text-blue-600"
                : ""
            }`}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1 size={20} />
          </button>

          <button
            className={`p-3 rounded-xl transition-all duration-200 hover:bg-blue-100 hover:text-blue-600 hover:scale-110 ${
              editor?.isActive("heading", { level: 2 })
                ? "bg-blue-100 text-blue-600"
                : ""
            }`}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 size={20} />
          </button>

          <div className="w-px h-7 bg-gray-300 mx-1" />

          <button
            className={`p-3 rounded-xl transition-all duration-200 hover:bg-blue-100 hover:text-blue-600 hover:scale-110 ${
              editor?.isActive("bulletList") ? "bg-blue-100 text-blue-600" : ""
            }`}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List size={20} />
          </button>

          <button
            className="p-3 rounded-xl transition-all duration-200 hover:bg-blue-100 hover:text-blue-600 hover:scale-110"
            onClick={() => fileInputRef.current.click()}
          >
            <ImageIcon size={20} />
          </button>

          <div className="w-px h-7 bg-gray-300 mx-1" />

          <button
            className="p-3 rounded-xl transition-all duration-200 hover:bg-blue-100 hover:text-blue-600 hover:scale-110"
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <Undo2 size={20} />
          </button>

          <button
            className="p-3 rounded-xl transition-all duration-200 hover:bg-blue-100 hover:text-blue-600 hover:scale-110"
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <Redo2 size={20} />
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
      {showShareModal && (
        <ShareModal documentId={id} onClose={() => setShowShareModal(false)} />
      )}
      {showVersions && (
        <VersionModal
          documentId={id}
          onClose={() => setShowVersions(false)}
          onRestore={fetchDocuments}
        />
      )}
    </div>
  );
}

export default Editor;
