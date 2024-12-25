"use client";
import React, { useEffect, useState } from 'react'
import SprintManager from './sprint-manager';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import status from "@/data/status";
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CreateIssue from './create-issue';
import { getIssuesForSprint, updateIssueOrder } from '@/actions/issues';
import { BarLoader } from 'react-spinners';
import useFetch from '@/hooks/useFetch';
import IssueCard from '@/components/issue-card';
import { toast } from 'sonner';
import BoardFilters from './board-filters';

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [ removed ] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

const SprintBoard = ({ sprints, projectId, orgId}) => {
  const [currentSprint, setCurrentSprint] = useState(sprints.find(spr => spr.status === "ACTIVE") || sprints[0]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const {
    loading: issuesLoading,
    error: issuesError,
    fn: fetchIssues,
    data: issues,
    setData: setIssues,
  } = useFetch(getIssuesForSprint);

  const {
    fn: updateIssueOrderFn,
    loading: updateIssuesLoading,
    error: updateIssuesError,
  } = useFetch(updateIssueOrder);

  useEffect(() => {
    if(currentSprint.id) {
      fetchIssues(currentSprint.id);
    }
  }, [currentSprint.id]);
  const [ filteredIssues, setFilteredIssue] = useState(issues);

  const handleFilterChange = (newFilteredIssues) => {
    setFilteredIssue(newFilteredIssues);
  }
  const onDragEnd = async (result) => {
    if(currentSprint.status === "PLANNED") {
      toast.warning("Start the sprint to update the board");
      return;
    }

    if(currentSprint.status === "COMPLETED") {
      toast.warning("Cannot update the board as the sprint is completed");
      return;
    }

    const { destination, source } = result;

    if(!destination) {
      return;
    }

    if(destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const newOrderedData = [...issues];

    // source list
    const sourceList = newOrderedData.filter(list => list.status === source.droppableId);
    // destination lists
    const destinationList = newOrderedData.filter(list => list.status === destination.droppableId);

    if(source.droppableId === destination.droppableId) {
      const reorderedCards = reorder(sourceList, source.index, destination.index);
      reorderedCards.forEach((card,index) => {
        card.order = index;
      });
    } else {
      const [ movedCard ] = sourceList.splice(source.index, 1);
      movedCard.status = destination.droppableId;
      destinationList.splice(destination.index, 0, movedCard);
      sourceList.forEach((card, index) => card.order = index);
      destinationList.forEach((card, index) => card.order = index);
    }
    const sortedIssues = newOrderedData.sort((a,b) => a.order - b.order);
    setIssues(newOrderedData, sortedIssues);

    // API call
    await updateIssueOrderFn(sortedIssues);
  }

  const handleAddIssue = status => {
    setSelectedStatus(status);
    setIsDrawerOpen(true);
  }

  const handleIssueCreated = () => {
    fetchIssues(currentSprint.id);
  }

  if(issuesError) return <div>Error loading issues</div>;

  return (
    <div>
      {/* Sprint Manager */}
      <SprintManager sprint={currentSprint} setSprint={setCurrentSprint} sprints={sprints} projectId={projectId} />

      {
        issues && !issuesLoading && (
          <BoardFilters issues={issues} onFilterChange={handleFilterChange} />
        )
      }

      {
        updateIssuesError && <p className='text-red-500 mt-2'>{updateIssuesError.message}</p>
      }

      { (updateIssuesLoading || issuesLoading) && <BarLoader className='mt-4' width={"100%"} color="#36d7b7" /> }
      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 bg-slate-900 p-4 rounded-lg'>
          {
            status.map(column => (
              <Droppable key={column.key} droppableId={column.key}>
                {
                  provided => {
                    return <div {...provided.droppableProps} ref={provided.innerRef} className='space-y-2'>
                      <h3 className='font-semibold mb-2 text-center'>{column.name}</h3>
                      {
                        filteredIssues?.filter(issue => issue.status === column.key).map((issue, index) => {
                          return <Draggable
                            key={issue.id}
                            draggableId={issue.id}
                            index={index}
                            isDragDisabled={updateIssuesLoading}
                          >
                            {(provided) => {
                              return <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <IssueCard issue={issue} 
                                onDelete={() => fetchIssues(currentSprint.id)}
                                onUpdate={(updated) =>
                                  setIssues((issues) =>
                                    issues.map((issue) => {
                                      if (issue.id === updated.id) return updated;
                                      return issue;
                                    })
                                  )
                                } />
                              </div>
                            }}
                          </Draggable>
                        })
                      }
                      {provided.placeholder}
                      {column.key === "TODO" && currentSprint.status !== "COMPLETED" && (
                        <Button variant="ghost" className="w-full" onClick={() => handleAddIssue(column.key)}>
                          <Plus className='mr-2 h-4 w-4' />
                          Create Issue
                        </Button>
                      )}
                    </div>
                  }
                }
              </Droppable>
            ))
          }
          
        </div>
      </DragDropContext>
      <CreateIssue
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        sprintId={currentSprint.id} 
        orgId={orgId} 
        projectId={projectId} 
        status={selectedStatus} 
        onIssueCreated={handleIssueCreated}      
      />
    </div>
    
  )
}

export default SprintBoard