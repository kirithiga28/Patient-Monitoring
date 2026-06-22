import React from "react";
import { ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "./Card";

export function ChartCard({ title, children, height = 300, className = "", action, ...props }) {
  return (
    <Card className={`${className}`} {...props}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {action && <div>{action}</div>}
      </CardHeader>
      
      <CardContent>
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
