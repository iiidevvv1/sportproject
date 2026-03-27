import { useEffect, useState } from 'react';

interface VersionInfo {
  version: string;
}

export function useVersion() {
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/version.json')
      .then((res) => res.json())
      .then((data: VersionInfo) => setVersion(data))
      .catch(() => setVersion({ version: '?.?.?' }))
      .finally(() => setIsLoading(false));
  }, []);

  return { version, isLoading };
}
