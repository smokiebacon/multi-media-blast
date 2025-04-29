
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const PlatformsAuthState: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Connections</CardTitle>
        <CardDescription>
          Please log in to manage your platform connections.
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

export default PlatformsAuthState;
