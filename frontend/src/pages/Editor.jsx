import { useEffect, useState, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const collaborativeCursorPluginKey = new PluginKey("collaborative-cursor");

const getAvatarColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "#F87171", "#FB923C", "#FBBF24", "#34D399", 
    "#60A5FA", "#818CF8", "#A78BFA", "#F472B6"
  ];
  return colors[Math.abs(hash) % colors.length];
};

const collaborativeCursorPlugin = new Plugin({
  key: collaborativeCursorPluginKey,
  state: {
    init() {
      return { cursors: {} };
    },
    apply(tr, prev) {
      const action = tr.getMeta(collaborativeCursorPluginKey);
      if (action) {
        if (action.type === "update") {
          return {
            cursors: {
              ...prev.cursors,
              [action.clientId]: {
                name: action.user.name,
                color: getAvatarColor(action.user.email),
                anchor: action.selection.anchor,
                head: action.selection.head,
              }
            }
          };
        } else if (action.type === "remove") {
          const next = { ...prev.cursors };
          delete next[action.clientId];
          return { cursors: next };
        }
      }
      
      const nextCursors = {};
      for (const [clientId, cursor] of Object.entries(prev.cursors)) {
        nextCursors[clientId] = {
          ...cursor,
          anchor: tr.mapping.map(cursor.anchor),
          head: tr.mapping.map(cursor.head),
        };
      }
      return { cursors: nextCursors };
    }
  },
  props: {
    decorations(state) {
      const { cursors } = collaborativeCursorPluginKey.getState(state);
      const decos = [];
      
      for (const [clientId, cursor] of Object.entries(cursors)) {
        const { name, color, anchor, head } = cursor;
        const docSize = state.doc.content.size;
        const boundedAnchor = Math.min(Math.max(0, anchor), docSize);
        const boundedHead = Math.min(Math.max(0, head), docSize);
        
        if (boundedAnchor === boundedHead) {
          const caret = document.createElement("span");
          caret.className = "collaborative-caret";
          caret.style.borderLeftColor = color;
          caret.style.borderLeftWidth = "2px";
          
          const tag = document.createElement("span");
          tag.className = "collaborative-caret-tag";
          tag.style.backgroundColor = color;
          tag.textContent = name;
          caret.appendChild(tag);
          
          decos.push(Decoration.widget(boundedAnchor, caret, { side: -1 }));
        } else {
          const from = Math.min(boundedAnchor, boundedHead);
          const to = Math.max(boundedAnchor, boundedHead);
          decos.push(Decoration.inline(from, to, {
            style: `background-color: ${color}40; border-bottom: 2px solid ${color}`,
            class: "collaborative-selection"
          }));
        }
      }
      
      return DecorationSet.create(state.doc, decos);
    }
  }
});

const CollaborativeCursorExtension = Extension.create({
  name: "collaborativeCursor",
  addProseMirrorPlugins() {
    return [collaborativeCursorPlugin];
  },
});
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
  const [permission, setPermission] = useState("");
  const [activeUsers, setActiveUsers] = useState([]);
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const timerRef = useRef(null);
  const isInitialLoad = useRef(true);
  const isRemoteUpdate = useRef(false);
  const fileInputRef = useRef(null);
  const { accessToken, user } = useContext(AuthContext);
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
      CollaborativeCursorExtension,
    ],
    content: "",
    editable: permission !== "viewer",
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
    onSelectionUpdate: ({ editor }) => {
      if (permission === "viewer") return; // Viewers don't emit selection
      const { selection } = editor.state;
      socket.emit("cursor-move", {
        documentId: id,
        selection: {
          anchor: selection.anchor,
          head: selection.head,
        },
      });
    },
  });

  const saveDocument = async () => {
    console.log("SAVE DOCUMENT CALLED");
    try {
      // Save local draft snapshot to localStorage as offline safety backup
      localStorage.setItem(`draft_doc_${id}`, JSON.stringify({ title, content, updatedAt: Date.now() }));

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

      // Clean up local safety draft once cloud save succeeds
      localStorage.removeItem(`draft_doc_${id}`);
      setSaveStatus("Saved");
    } catch (err) {
      console.log("Save error:", err);
      if (!navigator.onLine) {
        setSaveStatus("Offline (Saved locally)");
      } else {
        setSaveStatus("Error saving");
      }
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
      setPermission(response.data.permission);
      console.log(response.data.permission);
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
    }, 3000);

    return () => clearTimeout(timerRef.current);
  }, [content, title]);

  // Sync offline local drafts automatically when internet connection is restored
  useEffect(() => {
    const handleOnline = () => {
      console.log("Network restored! Syncing offline draft...");
      const draft = localStorage.getItem(`draft_doc_${id}`);
      if (draft) {
        setSaveStatus("Syncing...");
        saveDocument();
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [id, content, title]);

  useEffect(() => {
    if (!user || !permission) return;

    const handleConnect = () => {
      console.log("Socket connected, joining document room with user info:", id);
      socket.emit("join-document", {
        documentId: id,
        user: {
          name: user.name,
          email: user.email,
          permission: permission,
        },
      });
    };

    socket.on("connect", handleConnect);

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.disconnect();
    };
  }, [id, user, permission]);

  useEffect(() => {
    const handleActiveUsers = (users) => {
      console.log("Active users received:", users);
      setActiveUsers(users);
    };

    socket.on("active-users", handleActiveUsers);

    return () => {
      socket.off("active-users", handleActiveUsers);
    };
  }, []);

  useEffect(() => {
    if (!editor) return;

    const handler = (content) => {
      isRemoteUpdate.current = true;
      
      // Save current selection to prevent cursor jumping
      const { selection } = editor.state;
      const { anchor, head } = selection;

      editor.commands.setContent(content);

      // Restore selection, ensuring it is within new document bounds
      const docSize = editor.state.doc.content.size;
      const newAnchor = Math.min(anchor, docSize);
      const newHead = Math.min(head, docSize);

      editor.commands.setTextSelection({ from: newAnchor, to: newHead });
    };

    const handleCursorMoved = ({ clientId, user, selection }) => {
      const tr = editor.state.tr;
      tr.setMeta(collaborativeCursorPluginKey, {
        type: "update",
        clientId,
        user,
        selection,
      });
      tr.setMeta("addToHistory", false);
      editor.view.dispatch(tr);
    };

    const handleCursorRemoved = ({ clientId }) => {
      const tr = editor.state.tr;
      tr.setMeta(collaborativeCursorPluginKey, {
        type: "remove",
        clientId,
      });
      tr.setMeta("addToHistory", false);
      editor.view.dispatch(tr);
    };

    socket.on("receive-changes", handler);
    socket.on("cursor-moved", handleCursorMoved);
    socket.on("cursor-removed", handleCursorRemoved);

    return () => {
      socket.off("receive-changes", handler);
      socket.off("cursor-moved", handleCursorMoved);
      socket.off("cursor-removed", handleCursorRemoved);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    editor.setEditable(permission !== "viewer");
  }, [editor, permission]);

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

          <div className="flex items-center gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={permission === "viewer"}
              className="text-lg font-normal outline-none px-2 py-1 rounded hover:bg-gray-100 disabled:bg-transparent"
            />
            {permission === "owner" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                👑 Owner
              </span>
            )}
            {permission === "editor" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ✏ Editor
              </span>
            )}
            {permission === "viewer" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                👁 Viewer
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Active Users Display */}
          <div className="flex items-center gap-3 mr-2">
            {/* Editors */}
            {activeUsers.filter(u => u.permission === "owner" || u.permission === "editor").length > 0 && (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-emerald-800 font-medium">Editing:</span>
                <div className="flex -space-x-1.5 overflow-hidden">
                  {activeUsers
                    .filter(u => u.permission === "owner" || u.permission === "editor")
                    .map((u, i) => (
                      <div 
                        key={i} 
                        title={`${u.name} (${u.email}) - ${u.permission}`}
                        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-bold ring-2 ring-white cursor-pointer hover:scale-110 transition-transform"
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Viewers */}
            {activeUsers.filter(u => u.permission === "viewer").length > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-amber-800 font-medium">Viewing:</span>
                <div className="flex -space-x-1.5 overflow-hidden">
                  {activeUsers
                    .filter(u => u.permission === "viewer")
                    .map((u, i) => (
                      <div 
                        key={i} 
                        title={`${u.name} (${u.email}) - Viewer`}
                        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[9px] font-bold ring-2 ring-white cursor-pointer hover:scale-110 transition-transform"
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

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
        {permission !== "viewer" && (
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
        )}

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
