"use client";
import { deleteProject } from '@/actions/project';
import { Button } from '@/components/ui/button';
import useFetch from '@/hooks/useFetch';
import { useOrganization } from '@clerk/nextjs'
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react'
import { toast } from 'sonner';

const DeleteProject = ({ projectId }) => {
  const router = useRouter();
  
  const { data: deleted, loading: isDeleting, error, fn: deleteProjectFn } = useFetch(deleteProject);
  useEffect(() => {
    if(deleted?.success) {
        router.refresh();
        toast.error("Project Deleted");
    }
  }, [deleted]);
  const { membership } = useOrganization();

  const isAdmin = membership?.role === "org:admin";

  if(!isAdmin) return null;

  const handleDelete = () => {
    if(window.confirm("Are you sure you want to delete this project")) {
        deleteProjectFn(projectId);
    }
  }

  return <>
    <Button variant="ghost" onClick={handleDelete} disabled={isDeleting} className={`${isDeleting ? "animate-pulse" : "" }`} size='sm'>
        <Trash2 className='h-4 w-4' />
    </Button>
    {error && <p className='text-red-500 text-sm mt-2'>{error.message}</p>}
  </>
}

export default DeleteProject