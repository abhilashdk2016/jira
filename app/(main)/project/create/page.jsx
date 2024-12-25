"use client";

import OrgSwitcher from '@/components/OrgSwitcher';
import { useOrganization, useUser } from '@clerk/nextjs';
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSchema } from '@/lib/validators';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import useFetch from '@/hooks/useFetch';
import { createProject } from '@/actions/project';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const CreateProject = () => {
  const { isLoaded: isOrgLoaded, membership } = useOrganization();
  const { isLoaded: isUserLoaded } = useUser();
  const [ isAdmin, setIsAdmin ] = useState();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(projectSchema)
  });
  const router = useRouter();

  useEffect(() => {
    if(isOrgLoaded && isUserLoaded && membership) {
        setIsAdmin(membership.role === "org:admin")
    }
  }, [isOrgLoaded, isUserLoaded, membership]);

  const { data: project, loading, error, fn: createProjectFn } = useFetch(createProject);

  const onSubmit = async (data) => {
    createProjectFn(data);
  }

  useEffect(() => {
    if(project) {
        toast.success("Project created successfully");
        router.push(`/project/${project.id}`);
    }
  }, [loading]);

  if(!isOrgLoaded || !isUserLoaded) {
    return null;
  }

  if(!isAdmin) {
    return (
        <div className='flex flex-col gap-2 items-center'>
            <span className='text-2xl gradient-title'>Oops! Only Admins can create projects.</span>
            <OrgSwitcher />
        </div>
    );
  }

  return (
    <div className='container mx-auto py-10'>
        <h1 className='text-6xl text-center font-bold mb-8 gradient-title'>Create New Project</h1>
        <form className='flex flex-col space-y-4' onSubmit={handleSubmit(onSubmit)}>
            <div>
                <Input 
                    id="name"
                    className="bg-slate-950"
                    placeholder="Project Name"
                    {...register("name")}
                />
                {errors.name && <p className='text-red-500 text-sm mt-1'>{errors.name.message}</p>}
            </div>
            <div>
                <Input 
                    id="key"
                    className="bg-slate-950"
                    placeholder="Project Key"
                    {...register("key")}
                />
                {errors.key && <p className='text-red-500 text-sm mt-1'>{errors.key.message}</p>}
            </div>
            <div>
                <Textarea 
                    id="description"
                    className="bg-slate-950 h-28"
                    placeholder="Project Description"
                    {...register("description")}
                />
                {errors.description && <p className='text-red-500 text-sm mt-1'>{errors.description.message}</p>}
            </div>

            <Button disabled={loading} type="submit" size="lg" className="bg-blue-500 text-white">
                {loading ? "Creating..." : "Create Project"}
            </Button>
            {error && <p className='text-red-500 text-sm mt-2'>{error.message}</p>}
        </form>
    </div>
  )
}

export default CreateProject