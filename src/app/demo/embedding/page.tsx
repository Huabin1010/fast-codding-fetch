'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Database, Search, Plus, Trash2, Upload, CheckCircle, XCircle } from 'lucide-react'
import { 
    listIndexes, 
    createIndex, 
    upsertEmbeddings, 
    queryEmbeddings, 
    deleteIndex,
    getDefaultDimension 
} from '../store/action'

interface Index {
    name: string
    dimension?: number
    vectorCount?: number
}

interface QueryResult {
    id?: string
    score?: number
    metadata?: Record<string, any>
}

export default function EmbeddingPage() {
    const [indexes, setIndexes] = useState<Index[]>([])
    const [loading, setLoading] = useState(false)
    const [newIndexName, setNewIndexName] = useState('')
    const [newIndexDimension, setNewIndexDimension] = useState('1536')
    const [selectedIndex, setSelectedIndex] = useState('')
    const [queryText, setQueryText] = useState('artificial intelligence')
    const [queryResults, setQueryResults] = useState<QueryResult[]>([])
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text })
        setTimeout(() => setMessage(null), 5000)
    }

    // Load default dimension from environment variable
    useEffect(() => {
        const loadDefaultDimension = async () => {
            try {
                const defaultDim = await getDefaultDimension()
                setNewIndexDimension(defaultDim.toString())
            } catch (error) {
                console.error('Failed to load default dimension:', error)
            }
        }
        loadDefaultDimension()
    }, [])

    const handleListIndexes = async () => {
        setLoading(true)
        try {
            const result = await listIndexes()
            if (result.success) {
                const indexData = result.data || []
                const formattedIndexes = Array.isArray(indexData) 
                    ? indexData.map(index => typeof index === 'string' ? { name: index } : index)
                    : []
                setIndexes(formattedIndexes)
                showMessage('success', 'Indexes loaded successfully')
            } else {
                showMessage('error', result.error || 'Failed to load indexes')
            }
        } catch (error) {
            showMessage('error', 'Failed to load indexes')
        }
        setLoading(false)
    }

    const handleCreateIndex = async () => {
        if (!newIndexName.trim()) {
            showMessage('error', 'Index name is required')
            return
        }
        
        setLoading(true)
        try {
            const result = await createIndex(newIndexName, parseInt(newIndexDimension))
            if (result.success) {
                showMessage('success', result.message || 'Index created successfully')
                setNewIndexName('')
                handleListIndexes()
            } else {
                showMessage('error', result.error || 'Failed to create index')
            }
        } catch (error) {
            showMessage('error', 'Failed to create index')
        }
        setLoading(false)
    }

    const handleUpsertEmbeddings = async () => {
        if (!selectedIndex) {
            showMessage('error', 'Please select an index')
            return
        }
        
        setLoading(true)
        try {
            const result = await upsertEmbeddings(selectedIndex)
            if (result.success) {
                showMessage('success', result.message || 'Embeddings upserted successfully')
            } else {
                showMessage('error', result.error || 'Failed to upsert embeddings')
            }
        } catch (error) {
            showMessage('error', 'Failed to upsert embeddings')
        }
        setLoading(false)
    }

    const handleQueryEmbeddings = async () => {
        if (!selectedIndex) {
            showMessage('error', 'Please select an index')
            return
        }
        
        setLoading(true)
        try {
            const result = await queryEmbeddings(selectedIndex, queryText)
            if (result.success) {
                setQueryResults(result.data || [])
                showMessage('success', `Found ${result.data?.length || 0} similar vectors`)
            } else {
                showMessage('error', result.error || 'Failed to query embeddings')
            }
        } catch (error) {
            showMessage('error', 'Failed to query embeddings')
        }
        setLoading(false)
    }

    const handleDeleteIndex = async (indexName: string) => {
        setLoading(true)
        try {
            const result = await deleteIndex(indexName)
            if (result.success) {
                showMessage('success', result.message || 'Index deleted successfully')
                handleListIndexes()
                if (selectedIndex === indexName) {
                    setSelectedIndex('')
                    setQueryResults([])
                }
            } else {
                showMessage('error', result.error || 'Failed to delete index')
            }
        } catch (error) {
            showMessage('error', 'Failed to delete index')
        }
        setLoading(false)
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3 mb-8">
                <Database className="h-8 w-8 text-blue-600" />
                <div>
                    <h1 className="text-3xl font-bold">Vector Database Demo</h1>
                    <p className="text-gray-600">Explore vector storage and similarity search with LibSQL</p>
                </div>
            </div>

            {message && (
                <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                    {message.type === 'error' ? <XCircle className="h-4 w-4 text-red-600" /> : <CheckCircle className="h-4 w-4 text-green-600" />}
                    <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                        {message.text}
                    </AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="indexes" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="indexes">Index Management</TabsTrigger>
                    <TabsTrigger value="embeddings">Embeddings</TabsTrigger>
                    <TabsTrigger value="search">Vector Search</TabsTrigger>
                </TabsList>

                <TabsContent value="indexes" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Plus className="h-5 w-5" />
                                    Create New Index
                                </CardTitle>
                                <CardDescription>
                                    Create a new vector index with specified dimensions
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Index Name</label>
                                    <Input
                                        placeholder="my_collection_123"
                                        value={newIndexName}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewIndexName(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Use only letters, numbers, and underscores
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Dimensions</label>
                                    <Input
                                        type="number"
                                        value={newIndexDimension}
                                        readOnly
                                        className="bg-gray-50 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Configured from EMBEDDING_DIMENSION environment variable
                                    </p>
                                </div>
                                <Button onClick={handleCreateIndex} disabled={loading} className="w-full">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                    Create Index
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="h-5 w-5" />
                                    Existing Indexes
                                </CardTitle>
                                <CardDescription>
                                    Manage your vector indexes
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <Button onClick={handleListIndexes} disabled={loading} variant="outline" className="w-full">
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Refresh Indexes
                                    </Button>
                                    
                                    {indexes.length === 0 ? (
                                        <p className="text-gray-500 text-center py-4">No indexes found</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {indexes.map((index) => (
                                                <div key={index.name} className="flex items-center justify-between p-3 border rounded-lg">
                                                    <div>
                                                        <div className="font-medium">{index.name}</div>
                                                        <div className="text-sm text-gray-500">
                                                            {index.dimension ? `${index.dimension} dimensions` : 'Unknown dimensions'}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setSelectedIndex(index.name)}
                                                        >
                                                            Select
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleDeleteIndex(index.name)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="embeddings" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="h-5 w-5" />
                                Upload Sample Embeddings
                            </CardTitle>
                            <CardDescription>
                                Add sample embeddings with metadata to your selected index
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Selected Index</label>
                                <div className="flex gap-2">
                                    <Input
                                        value={selectedIndex}
                                        placeholder="Select an index first"
                                        readOnly
                                    />
                                    <Button variant="outline" onClick={handleListIndexes}>
                                        Refresh
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium mb-2">Sample Data Preview</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex gap-2">
                                        <Badge variant="secondary">AI/ML</Badge>
                                        <span>Machine learning is a subset of artificial intelligence...</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant="secondary">Database</Badge>
                                        <span>Vector databases are specialized databases designed...</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant="secondary">Data Science</Badge>
                                        <span>Embeddings are dense vector representations...</span>
                                    </div>
                                </div>
                            </div>
                            
                            <Button 
                                onClick={handleUpsertEmbeddings} 
                                disabled={loading || !selectedIndex}
                                className="w-full"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                                Upload Sample Embeddings
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="search" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="h-5 w-5" />
                                Vector Similarity Search
                            </CardTitle>
                            <CardDescription>
                                Search for similar vectors using semantic similarity
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Selected Index</label>
                                <Input
                                    value={selectedIndex}
                                    placeholder="Select an index first"
                                    readOnly
                                />
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium">Query Text</label>
                                <Input
                                    placeholder="Enter your search query..."
                                    value={queryText}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQueryText(e.target.value)}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    This will be converted to a vector for similarity search
                                </p>
                            </div>
                            
                            <Button 
                                onClick={handleQueryEmbeddings} 
                                disabled={loading || !selectedIndex}
                                className="w-full"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                                Search Similar Vectors
                            </Button>
                        </CardContent>
                    </Card>

                    {queryResults.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Search Results</CardTitle>
                                <CardDescription>
                                    Found {queryResults.length} similar vectors
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {queryResults.map((result, index) => (
                                        <div key={index} className="border rounded-lg p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex gap-2">
                                                    <Badge variant="outline">{result.metadata?.category}</Badge>
                                                    <Badge variant="secondary">
                                                        Score: {result.score?.toFixed(4) || 'N/A'}
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    ID: {result.metadata?.id}
                                                </div>
                                            </div>
                                            <p className="text-sm mb-2">{result.metadata?.text}</p>
                                            <div className="text-xs text-gray-500 space-y-1">
                                                <div>Author: {result.metadata?.author}</div>
                                                <div>Created: {result.metadata?.createdAt ? new Date(result.metadata.createdAt).toLocaleString() : 'N/A'}</div>
                                                <div>Confidence: {result.metadata?.confidenceScore?.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}