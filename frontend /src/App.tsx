
import { Button } from "./components/ui/button";
import { Textarea } from "./components/ui/textarea";
import "./index.css";
import axios from "axios";
import { useRef, useState } from "react";


const API_URL = "http://localhost:3000";


export function App() {

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [status, setStatus] = useState<string>("PROCESSING");
  const [output, setOutput] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("js");



  async function pollBackendForResult(submissionId: string) {
    const response = await axios.get(`${API_URL}/submission/${submissionId}`);
    console.log(response.data);
    if (response.data.submission.status !== "PROCESSING") {
      setStatus(response.data.submission.status);
      setOutput(response.data.submission.output);
    } else {
      setStatus("PROCESSING");
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds before polling again
      pollBackendForResult(submissionId);
    }
  }

  return (
    <>
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="flex-1 h-screen w-screen bg-yellow-200 p-4 justify-center gap-4">
          <div className="flex gap-4  justify-center">
            <div className="flex-1 flex gap-4 justify-center">
              <Button variant={selectedLanguage === "js" ? "destructive" : "outline"} onClick={() => setSelectedLanguage("js")}>
                JS
              </Button>
              <Button variant={selectedLanguage === "py" ? "destructive" : "outline"} onClick={() => setSelectedLanguage("py")}>
                Python
              </Button>
              <Button variant={selectedLanguage === "c++" ? "destructive" : "outline"} onClick={() => setSelectedLanguage("c++")}>
                C++
              </Button>
            </div>
            <div className="flex-1 gap-4">
              <Button onClick={
                async () => {
                  const response = await axios.post(`${API_URL}/submission`, {
                    code: textareaRef.current?.value || "",
                    language: selectedLanguage,
                  });
                  console.log(response.data);
                  console.log("submissionId: ", response.data.submissionId);

                  pollBackendForResult(response.data.submissionId);
                }
              }>Submit</Button>
            </div>
          </div>
          <div className="flex-1 h-screen items-center justify-center p-4">
            <Textarea ref={textareaRef} placeholder="Code here..." className="h-screen m-4 p-4 bg-white border border-gray-800" />
          </div>
        </div>
        <div className="flex-1 h-screen w-screen items-center justify-center bg-green-200 ">
          <h2 className="text-lg font-bold">Status: {status}</h2>
          <pre className="mt-2"> Output: {output}</pre>
        </div>
      </div>
    </>
  );
}


export default App;
