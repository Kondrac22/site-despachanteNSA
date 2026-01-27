"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Clock, FileText } from "lucide-react";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  documents: string[];
  estimatedTime: string;
  pricing: string;
}

export default function ServiceCard({
  title,
  description,
  icon,
  documents,
  estimatedTime,
  pricing,
}: ServiceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              Ocultar detalhes <ChevronUp className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Ver detalhes <ChevronDown className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        {isExpanded && (
          <div className="mt-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Documentos Necessários:</h4>
              </div>
              <ul className="space-y-2 ml-7">
                {documents.map((doc, index) => (
                  <li
                    key={index}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-primary mt-1">•</span>
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Tempo Estimado:</h4>
              </div>
              <p className="text-sm text-muted-foreground ml-7">
                {estimatedTime}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[var(--orange)]/10 border border-[var(--orange)]/20">
              <p className="text-sm font-semibold text-center">{pricing}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
