import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';

// ----------------------------------------------------------------------

type ContentSkeletonProps = {
  type: 'text' | 'multiple-choice';
};

export function ContentSkeleton({ type }: ContentSkeletonProps) {
  return (
    <Box sx={{ display: 'flex', gap: 1, px: 1, py: 0.5, borderRadius: 2 }}>
      {/* Mimic the action buttons column */}
      <Stack direction="row" spacing={0} alignItems="flex-start" sx={{ pt: 1.5 }}>
        <Skeleton variant="circular" width={28} height={28} />
        <Skeleton variant="circular" width={28} height={28} />
        <Skeleton variant="circular" width={28} height={28} />
      </Stack>

      <Paper
        variant="outlined"
        sx={{ flexGrow: 1, px: 2, py: 1.5, borderRadius: 2, borderColor: 'transparent' }}
      >
        {type === 'text' ? (
          <Stack spacing={1}>
            <Skeleton variant="text" width="90%" height={24} />
            <Skeleton variant="text" width="75%" height={24} />
            <Skeleton variant="text" width="85%" height={24} />
            <Skeleton variant="text" width="60%" height={24} />
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Skeleton variant="text" width="65%" height={24} />
            <Stack spacing={0.5}>
              {([80, 60, 75, 65] as const).map((w, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Skeleton variant="circular" width={24} height={24} sx={{ flexShrink: 0 }} />
                  <Skeleton variant="text" width={`${w}%`} height={24} />
                </Box>
              ))}
            </Stack>
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
