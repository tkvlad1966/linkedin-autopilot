import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import type { SequenceStep } from '@shared/types'
import {
  useSequenceSteps,
  useReorderSteps,
  useDeleteStep,
} from '../../hooks/useCampaigns'
import { useToast } from '../../hooks/useToast'
import { SequenceStepCard } from './SequenceStep'
import { StepEditorPanel } from './StepEditorPanel'
import styles from './SequenceBuilder.module.scss'

interface Props {
  campaignId: string
}

export function SequenceBuilder({ campaignId }: Props) {
  const { data: steps = [], isLoading } = useSequenceSteps(campaignId)
  const reorderSteps = useReorderSteps()
  const deleteStep = useDeleteStep()
  const { toast } = useToast()

  const [editingStep, setEditingStep] = useState<Partial<SequenceStep> | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = steps.findIndex((s) => s.id === active.id)
      const newIndex = steps.findIndex((s) => s.id === over.id)
      const reordered = arrayMove(steps, oldIndex, newIndex)

      reorderSteps.mutate({
        campaignId,
        orderedIds: reordered.map((s) => s.id),
      })
    },
    [steps, campaignId, reorderSteps],
  )

  function handleEdit(step: SequenceStep) {
    setEditingStep(step)
    setPanelOpen(true)
  }

  function handleAdd() {
    setEditingStep(null)
    setPanelOpen(true)
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this step?')) return
    deleteStep.mutate(
      { id, campaignId },
      {
        onSuccess: () => toast.success('Step deleted'),
        onError: () => toast.error('Failed to delete step'),
      },
    )
  }

  if (isLoading) return <p>Loading sequence...</p>

  return (
    <div className={styles.builder}>
      {steps.length === 0 ? (
        <p className={styles.empty}>
          No steps yet. Add your first step to build the sequence.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className={styles.steps}>
              {steps.map((step, i) => (
                <SequenceStepCard
                  key={step.id}
                  step={step}
                  index={i}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <button className={styles.addBtn} onClick={handleAdd}>
        <Plus size={16} />
        Add Step
      </button>

      <AnimatePresence>
        {panelOpen && (
          <StepEditorPanel
            campaignId={campaignId}
            step={editingStep}
            nextOrder={steps.length + 1}
            onClose={() => setPanelOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
