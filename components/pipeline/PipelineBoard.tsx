'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Tag, FileText, MessageSquare, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { OpportunityCard } from './OpportunityCard';
import { OpportunityModal } from './OpportunityModal';
import { AddProspectModal } from './AddProspectModal';

interface StageConfig {
  name: string;
  description: string;
}

const stageConfigs: StageConfig[] = [
  {
    name: 'New Prospect',
    description: 'Initial lead/idea',
  },
  {
    name: 'Discovery',
    description: 'Researching the artist (fit, availability, draw potential)',
  },
  {
    name: 'Qualification',
    description: "Verified they're bookable and a good fit",
  },
  {
    name: 'Booking Stage',
    description: 'Active negotiation with agent/artist',
  },
  {
    name: 'Finalization',
    description: 'Contract signed, logistics being finalized',
  },
  {
    name: 'Completed Show',
    description: 'Show happened successfully',
  },
];

const stages = stageConfigs.map((stage) => stage.name);

export function PipelineBoard() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dragPositionRef = useRef<{ x: number; y: number } | null>(null);
  const mouseMoveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  useEffect(() => {
    // Check initial scroll state
    const container = scrollContainerRef.current;
    if (container) {
      const hasScroll = container.scrollWidth > container.clientWidth;
      setShowRightArrow(hasScroll);
    }
  }, [opportunities]);

  // Cleanup auto-scroll on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  const fetchOpportunities = async () => {
    try {
      const response = await fetch('/api/opportunities');
      if (response.ok) {
        const data = await response.json();
        setOpportunities(data);
      }
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onDragStart = (start: any) => {
    isDraggingRef.current = true;
    dragPositionRef.current = null;
    
    // Setup mouse move handler for auto-scrolling
    if (scrollContainerRef.current) {
      const scrollThreshold = 350; // pixels from edge to trigger scroll (much higher for easier detection)
      const scrollSpeed = 2400; // pixels per scroll step (tripled for much faster scrolling)
      const scrollInterval = 3; // ~333fps for extremely responsive scrolling

      // Clean up any existing handler first
      if (mouseMoveHandlerRef.current) {
        window.removeEventListener('mousemove', mouseMoveHandlerRef.current);
      }

      mouseMoveHandlerRef.current = (e: MouseEvent) => {
        if (!isDraggingRef.current || !scrollContainerRef.current) {
          return;
        }

        dragPositionRef.current = { x: e.clientX, y: e.clientY };
        
        const container = scrollContainerRef.current;
        const containerRect = container.getBoundingClientRect();
        const mouseX = e.clientX;
        const containerLeft = containerRect.left;
        const containerRight = containerRect.right;
        const distanceFromLeft = mouseX - containerLeft;
        const distanceFromRight = containerRight - mouseX;

        // Check if we should scroll left
        if (distanceFromLeft < scrollThreshold && container.scrollLeft > 0) {
          if (!autoScrollIntervalRef.current) {
            autoScrollIntervalRef.current = setInterval(() => {
              if (scrollContainerRef.current && isDraggingRef.current && dragPositionRef.current) {
                const currentContainer = scrollContainerRef.current;
                const currentRect = currentContainer.getBoundingClientRect();
                const currentMouseX = dragPositionRef.current.x;
                const currentDistanceFromLeft = currentMouseX - currentRect.left;
                
                if (currentDistanceFromLeft < scrollThreshold && currentContainer.scrollLeft > 0) {
                  // Much faster when closer to edge - use cubic for very aggressive acceleration
                  const proximityRatio = 1 - (currentDistanceFromLeft / scrollThreshold);
                  // At edge (proximityRatio = 1): full speed, at threshold (proximityRatio = 0): minimal speed
                  const scrollAmount = Math.max(10, scrollSpeed * proximityRatio * proximityRatio * proximityRatio);
                  currentContainer.scrollLeft = Math.max(
                    0,
                    currentContainer.scrollLeft - scrollAmount
                  );
                  handleScroll({ currentTarget: currentContainer } as React.UIEvent<HTMLDivElement>);
                } else {
                  if (autoScrollIntervalRef.current) {
                    clearInterval(autoScrollIntervalRef.current);
                    autoScrollIntervalRef.current = null;
                  }
                }
              }
            }, scrollInterval);
          }
        }
        // Check if we should scroll right
        else if (distanceFromRight < scrollThreshold && 
                 container.scrollLeft < container.scrollWidth - container.clientWidth) {
          if (!autoScrollIntervalRef.current) {
            autoScrollIntervalRef.current = setInterval(() => {
              if (scrollContainerRef.current && isDraggingRef.current && dragPositionRef.current) {
                const currentContainer = scrollContainerRef.current;
                const currentRect = currentContainer.getBoundingClientRect();
                const currentMouseX = dragPositionRef.current.x;
                const currentDistanceFromRight = currentRect.right - currentMouseX;
                
                if (currentDistanceFromRight < scrollThreshold && 
                    currentContainer.scrollLeft < currentContainer.scrollWidth - currentContainer.clientWidth) {
                  // Much faster when closer to edge - use cubic for very aggressive acceleration
                  const proximityRatio = 1 - (currentDistanceFromRight / scrollThreshold);
                  // At edge (proximityRatio = 1): full speed, at threshold (proximityRatio = 0): minimal speed
                  const scrollAmount = Math.max(10, scrollSpeed * proximityRatio * proximityRatio * proximityRatio);
                  currentContainer.scrollLeft = Math.min(
                    currentContainer.scrollWidth - currentContainer.clientWidth,
                    currentContainer.scrollLeft + scrollAmount
                  );
                  handleScroll({ currentTarget: currentContainer } as React.UIEvent<HTMLDivElement>);
                } else {
                  if (autoScrollIntervalRef.current) {
                    clearInterval(autoScrollIntervalRef.current);
                    autoScrollIntervalRef.current = null;
                  }
                }
              }
            }, scrollInterval);
          }
        }
        // Stop scrolling if not near edges
        else {
          if (autoScrollIntervalRef.current) {
            clearInterval(autoScrollIntervalRef.current);
            autoScrollIntervalRef.current = null;
          }
        }
      };

      cleanupRef.current = () => {
        if (mouseMoveHandlerRef.current) {
          window.removeEventListener('mousemove', mouseMoveHandlerRef.current);
          mouseMoveHandlerRef.current = null;
        }
        if (autoScrollIntervalRef.current) {
          clearInterval(autoScrollIntervalRef.current);
          autoScrollIntervalRef.current = null;
        }
      };

      window.addEventListener('mousemove', mouseMoveHandlerRef.current);
    }

    console.log('Drag started:', start);
    console.log('Draggable ID:', start.draggableId);
    console.log('Available opportunities:', opportunities.map(o => o.id));
  };

  const onDragUpdate = (update: any) => {
    // This callback can be used for additional drag update logic if needed
    // The actual scrolling is handled by the mousemove listener set up in onDragStart
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    console.log('Drag ended:', result);
    
    // Cleanup auto-scroll and mouse listeners
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    
    // Reset dragging flag immediately
    isDraggingRef.current = false;
    dragPositionRef.current = null;

    if (!destination) {
      return;
    }
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const opportunity = opportunities.find((opp) => String(opp.id) === draggableId);
    if (!opportunity) {
      console.error('Opportunity not found:', draggableId);
      return;
    }

    const newStage = destination.droppableId;

    // Optimistically update UI
    const updatedOpportunities = opportunities.map((opp) =>
      String(opp.id) === draggableId ? { ...opp, stage: newStage } : opp
    );
    setOpportunities(updatedOpportunities);

    // Update in database
    try {
      const response = await fetch(`/api/opportunities/${draggableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });

      if (!response.ok) {
        // Revert on error
        fetchOpportunities();
      }
    } catch (error) {
      console.error('Failed to update opportunity:', error);
      fetchOpportunities();
    }
  };

  const opportunitiesByStage = useMemo(() => {
    const map = new Map<string, any[]>();
    stageConfigs.forEach((stageConfig) => {
      map.set(stageConfig.name, opportunities.filter((opp) => opp.stage === stageConfig.name));
    });
    return map;
  }, [opportunities]);

  const handleCardClick = (opportunity: any) => {
    // Only open modal if not dragging
    if (!isDraggingRef.current) {
      setSelectedOpportunity(opportunity);
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedOpportunity(null);
    fetchOpportunities();
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setShowLeftArrow(target.scrollLeft > 10);
    setShowRightArrow(
      target.scrollLeft < target.scrollWidth - target.clientWidth - 10
    );
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading pipeline...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-end mb-6 flex-shrink-0">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus className="w-4 h-4" />
          Add Prospect
        </button>
      </div>
      <DragDropContext onDragStart={onDragStart} onDragUpdate={onDragUpdate} onDragEnd={onDragEnd}>
        <div className="relative flex-1 min-h-0 flex flex-col">
          {/* Left scroll indicator */}
          {showLeftArrow && (
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white via-white to-transparent z-10 flex items-center justify-start pointer-events-none">
              <ChevronLeft className="text-gray-600 w-8 h-8 animate-pulse drop-shadow-md" />
            </div>
          )}
          
          {/* Right scroll indicator */}
          {showRightArrow && (
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white via-white to-transparent z-10 flex items-center justify-end pointer-events-none">
              <ChevronRight className="text-gray-600 w-8 h-8 animate-pulse drop-shadow-md" />
            </div>
          )}
          
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-6 overflow-x-auto overflow-y-hidden pb-4 px-2 -mx-2 scroll-smooth scrollbar-visible flex-1"
            style={{ scrollbarGutter: 'stable' }}
          >
            {stageConfigs.map((stageConfig) => {
            const stageOpportunities = opportunitiesByStage.get(stageConfig.name) || [];
            
            return (
              <div key={stageConfig.name} className="flex-shrink-0 w-80">
                <div
                  className="bg-gray-50 border-2 border-gray-200 rounded-xl shadow-lg h-full flex flex-col overflow-hidden"
                >
                  {/* Stage Header */}
                  <div className="bg-gray-100 border-b-2 border-gray-200 p-5 h-24 flex flex-shrink-0">
                    <div className="flex items-start justify-between w-full">
                      <div className="flex-1 pr-3">
                        <h3 className="font-bold text-lg text-gray-800 mb-1 leading-tight">
                          {stageConfig.name}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                          {stageConfig.description}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-300 flex-shrink-0 self-start">
                        {stageOpportunities.length}
                      </span>
                    </div>
                  </div>

                  {/* Stage Content */}
                  <div className="flex-1 p-4 overflow-y-auto bg-white scrollbar-visible" style={{ minHeight: 0 }}>
                    <Droppable droppableId={stageConfig.name}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`space-y-3 min-h-[550px] ${
                            snapshot.isDraggingOver 
                              ? 'bg-gray-50 ring-2 ring-offset-2 ring-gray-300 rounded-lg p-2' 
                              : ''
                          }`}
                        >
                          {stageOpportunities.map((opportunity, index) => {
                            const draggableId = String(opportunity.id);
                            return (
                              <Draggable
                                key={draggableId}
                                draggableId={draggableId}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                      ...provided.draggableProps.style,
                                      userSelect: 'none',
                                    }}
                                    className={`${
                                      snapshot.isDragging
                                        ? 'opacity-60 rotate-2 shadow-2xl z-50'
                                        : 'opacity-100'
                                    }`}
                                  >
                                    <OpportunityCard
                                      opportunity={opportunity}
                                      onOpen={() => handleCardClick(opportunity)}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                          
                          {stageOpportunities.length === 0 && (
                            <div className="flex items-center justify-center h-32 text-gray-400 text-sm italic">
                              No opportunities in this stage
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      </DragDropContext>

      {isModalOpen && selectedOpportunity && (
        <OpportunityModal
          opportunity={selectedOpportunity}
          onClose={handleModalClose}
        />
      )}

      {isAddModalOpen && (
        <AddProspectModal
          isOpen={isAddModalOpen}
          stages={stages}
          onClose={() => setIsAddModalOpen(false)}
          onCreated={fetchOpportunities}
        />
      )}
    </div>
  );
}

