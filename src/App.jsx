import { useState } from 'react'
import ApiTest from './ApiTest'
import './App.css'

function App() {
  const [showApiTest, setShowApiTest] = useState(false)

  return (
    <>
      <div>
        <h1>Directory Analyzer</h1>
        <p>Construction Document Analysis System</p>
        
        <div className="card">
          <button onClick={() => setShowApiTest(!showApiTest)}>
            {showApiTest ? 'Hide API Test' : 'Show API Test'}
          </button>
        </div>

        {showApiTest && <ApiTest />}
      </div>
    </>
  )
}

export default App
