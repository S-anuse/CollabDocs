import { Route, Routes } from "react-router-dom";
import Login from './pages/Login' 
import Register from './pages/Register' 
import Dashboard from './pages/Dashboard' 
import Editor from './pages/Editor' 
import ProtectedRoute from "./routes/ProtectedRoute";
import { Navigate } from "react-router-dom";

function App() {

  return (
    <div>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />}/>
        <Route path="/register" element={<Register />}/>
        <Route path="/dashboard" element={<ProtectedRoute>
                                            <Dashboard />
                                          </ProtectedRoute>
          }
        />

        <Route path="/editor/:id" element={<ProtectedRoute>
                                            <Editor />
                                          </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  ) ;
}

export default App ;