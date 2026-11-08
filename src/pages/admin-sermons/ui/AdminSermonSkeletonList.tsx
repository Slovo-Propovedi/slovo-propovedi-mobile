import { AdminSermonRow } from './AdminSermonRow'

const SKELETON_ROWS = 6

export const AdminSermonSkeletonList = () => (
  <>
    {Array.from({ length: SKELETON_ROWS }, (_, index) => (
      <AdminSermonRow.Skeleton key={index} />
    ))}
  </>
)
