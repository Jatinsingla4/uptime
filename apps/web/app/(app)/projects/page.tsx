'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@sitepulse/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { WebsiteMonitoringTable } from '@/components/projects/WebsiteMonitoringTable';
import { trpc } from '@/lib/trpc';

export default function ProjectsPage() {
  const { data: projects, isLoading } = trpc.projects.list.useQuery();
  const startCrawl = trpc.crawls.start.useMutation();
  const [addingProject, setAddingProject] = useState(false);

  const handleStartCrawl = (projectId: string) => {
    startCrawl.mutate({ projectId });
  };

  return (
    <>
      <PageHeader
        title="Projects"
        description={`${projects?.length ?? 0} website${projects?.length !== 1 ? 's' : ''} monitored`}
        actions={
          <Button
            leftIcon={<Plus />}
            onClick={() => setAddingProject(true)}
          >
            Add Website
          </Button>
        }
      />

      <WebsiteMonitoringTable
        projects={projects ?? []}
        loading={isLoading}
        onStartCrawl={handleStartCrawl}
      />
    </>
  );
}
