import { Badge } from '@sitepulse/ui';

interface StatusBadgeProps {
  isUp: boolean | null;
  paused?: boolean;
  degraded?: boolean;
}

export function StatusBadge({ isUp, paused, degraded }: StatusBadgeProps) {
  if (paused) return <Badge variant="neutral" dot>Paused</Badge>;
  if (isUp === null) return <Badge variant="neutral">Unknown</Badge>;
  if (degraded) return <Badge variant="warning" dot>Degraded</Badge>;
  if (isUp) return <Badge variant="success" dot pulse>Up</Badge>;
  return <Badge variant="danger" dot pulse>Down</Badge>;
}
