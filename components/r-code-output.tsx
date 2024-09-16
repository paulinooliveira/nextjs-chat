'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface RCodeOutputProps {
  rCode: string;
  result: any;
  outputVariableName: string;
  error?: string;
}

const RCodeOutput: React.FC<RCodeOutputProps> = ({ rCode, result, outputVariableName, error }) => {
  const [activeTab, setActiveTab] = useState<'resumo' | 'código R' | string>('resumo');

  const renderContent = () => {
    if (error) {
      return (
        <div className="prose dark:prose-invert">
          <h3 className="text-lg font-semibold mb-2 text-red-600">Erro na Execução</h3>
          <p>Ocorreu um erro ao executar o código R:</p>
          <pre className="bg-red-100 dark:bg-red-900 p-4 rounded-md overflow-x-auto">
            <code className="text-sm text-red-800 dark:text-red-200">{error}</code>
          </pre>
        </div>
      );
    }

    switch (activeTab) {
      case 'código R':
        return (
          <pre className="bg-muted p-4 rounded-md overflow-x-auto">
            <code className="text-sm">{rCode}</code>
          </pre>
        );
      case outputVariableName:
        return (
          <pre className="bg-muted p-4 rounded-md overflow-x-auto">
            <code className="text-sm">{JSON.stringify(result, null, 2)}</code>
          </pre>
        );
      case 'resumo':
      default:
        return (
          <div className="prose dark:prose-invert">
            <h3 className="text-lg font-semibold mb-2">Resumo da Execução</h3>
            <p>O código R foi executado com sucesso e o resultado foi armazenado na variável <code>{outputVariableName}</code>.</p>
            <p>Tipo de dado: {Array.isArray(result) ? 'Array' : typeof result}</p>
            {Array.isArray(result) && <p>Número de itens: {result.length}</p>}
            {typeof result === 'object' && result !== null && !Array.isArray(result) && (
              <p>Número de propriedades: {Object.keys(result).length}</p>
            )}
            {renderResultPreview()}
          </div>
        );
    }
  };

  const renderResultPreview = () => {
    if (Array.isArray(result)) {
      return (
        <div>
          <h4 className="text-md font-semibold mt-4 mb-2">Prévia dos dados:</h4>
          <pre className="bg-muted p-4 rounded-md overflow-x-auto">
            <code className="text-sm">{JSON.stringify(result.slice(0, 5), null, 2)}</code>
          </pre>
          {result.length > 5 && <p className="mt-2 text-sm text-gray-600">... (mostrando apenas os primeiros 5 itens)</p>}
        </div>
      );
    } else if (typeof result === 'object' && result !== null) {
      const preview = Object.entries(result).slice(0, 5).reduce<Record<string, any>>((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
      return (
        <div>
          <h4 className="text-md font-semibold mt-4 mb-2">Prévia dos dados:</h4>
          <pre className="bg-muted p-4 rounded-md overflow-x-auto">
            <code className="text-sm">{JSON.stringify(preview, null, 2)}</code>
          </pre>
          {Object.keys(result).length > 5 && <p className="mt-2 text-sm text-gray-600">... (mostrando apenas as primeiras 5 propriedades)</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-4">
      {!error && (
        <div className="flex space-x-2 mb-4">
          <Button
            variant={activeTab === 'código R' ? 'default' : 'outline'}
            onClick={() => setActiveTab('código R')}
            size="sm"
          >
            código R
          </Button>
          <Button
            variant={activeTab === outputVariableName ? 'default' : 'outline'}
            onClick={() => setActiveTab(outputVariableName)}
            size="sm"
          >
            {outputVariableName}
          </Button>
          <Button
            variant={activeTab === 'resumo' ? 'default' : 'outline'}
            onClick={() => setActiveTab('resumo')}
            size="sm"
          >
            resumo
          </Button>
        </div>
      )}
      <div className="border rounded-md p-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default RCodeOutput;