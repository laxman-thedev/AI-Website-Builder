// Fullscreen preview page for a project's generated HTML.
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom";
import { Loader2Icon } from "lucide-react";
import ProjectPreview from "../components/ProjectPreview";
import type { Project, Version } from "../types";
import api from "@/configs/axios";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

const Preview = () => {

    // Auth session ensures only logged-in users can preview.
    const {data: session, isPending} = authClient.useSession()
    const { projectId, versionId } = useParams()
    // HTML code to display in the iframe.
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(true);

    // Fetch project code and pick a version if provided.
    const fetchCode = async () => {
        try {
            const {data} = await api.get(`/api/project/preview/${projectId}`)
            setCode(data.project.current_code)
            if(versionId){
                data.project.versions.forEach((version: Version)=> {
                    if(version.id === versionId){
                        setCode(version.code)
                    }
                })
            }
            setLoading(false)
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to fetch project code')
        }            
    }  

    useEffect(() => {
        // Wait for session before loading preview data.
        if(!isPending && session?.user){
            fetchCode()
        }
    }, [session?.user])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2Icon className="size-7 animate-spin text-indigo-200" />
            </div>
        )
    }

    return (
        <div className="h-screen ">
            { code && <ProjectPreview project={{current_code: code} as Project} isGenerating={false} showEditorPanel={false} /> }
        </div>
    )
}

export default Preview
