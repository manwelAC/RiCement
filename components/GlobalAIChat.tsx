import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname } from 'expo-router';
import { addDoc, collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth, db } from '../config/firebase';
import { firebaseService } from '../services/firebaseService';
import { ThemedText } from './ThemedText';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

// Helper function to render text with bold markdown
const renderTextWithBold = (text: string, isUser: boolean) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return (
    <Text style={isUser ? styles.userMessageText : styles.aiMessageTextStyle}>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          // Remove ** and make bold
          const boldText = part.slice(2, -2);
          return (
            <Text key={index} style={{ fontWeight: '700' }}>
              {boldText}
            </Text>
          );
        }
        return <Text key={index}>{part}</Text>;
      })}
    </Text>
  );
};

// FAQ Data
const FAQs: FAQ[] = [
  {
    id: 'faq-1',
    question: 'What is this system and what does it do?',
    answer: 'RiCement automates the mixing and dispensing of cement with Rice Husk Ash'
  },
  {
    id: 'faq-2',
    question: 'Why use Rice Husk ash in cement mixture?',
    answer: 'According to an interview with Engr. Harffi Joy Hazel A. Caesar, RCE, a study investigated the effect of rice husk ash (RHA) as a partial replacement of cement in hollow sandcrete blocks. He explained that the study used varying proportions of RHA—0%, 5%, 10%, 20%, and 30% by weight of cement. Engr. Subang stated that the compressive strength of the blocks decreased with increasing ash content; however, those with 10% RHA replacement still achieved strength values that satisfied the minimum building standards (approximately 2.5 N/mm²). He further noted that the study recommended up to 10% RHA replacement for non-load bearing blocks, emphasizing that about 5.3% cost savings per block could be achieved by using RHA as partial cement replacement.'
  },
  {
    id: 'faq-3',
    question: 'How does the automated mixing process work?',
    answer: 'Create a project at the "Proyekto" tab and start creating by clicking the \'Dagdag\' button and input the fields that are required for the Project to start'
  }
];

export default function GlobalAIChat() {
  const pathname = usePathname();
  const [isAiChatVisible, setIsAiChatVisible] = useState(false);
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Routes where AI chat should NOT appear
  const hiddenRoutes = ['/', '/(tabs)', '/(tabs)/index'];
  
  // Don't render the chat bubble on certain routes
  if (hiddenRoutes.includes(pathname)) {
    return null;
  }

  // Handle FAQ button press
  const handleFAQPress = (faq: FAQ) => {
    // Add FAQ question as user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: faq.question,
      isUser: true,
      timestamp: new Date()
    };

    setAiMessages(prev => [...prev, userMessage]);

    // Add FAQ answer as AI message
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: faq.answer,
      isUser: false,
      timestamp: new Date()
    };

    setTimeout(() => {
      setAiMessages(prev => [...prev, aiMessage]);
    }, 300);
  };

  // AI Chat Functions
  const sendMessageToAI = async (message: string) => {
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      text: message.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setAiMessages(prev => [...prev, userMessage]);
    setAiChatInput('');
    setIsAiTyping(true);

    try {
      console.log('Sending message to AI:', message);
      
      // Check if the message is a command to execute an action
      const actionResult = await executeActionIfCommand(message);
      if (actionResult) {
        // Command was executed, show result
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: actionResult,
          isUser: false,
          timestamp: new Date()
        };
        setAiMessages(prev => [...prev, aiMessage]);
        setIsAiTyping(false);
        return;
      }
      
      // Call Gemini API (fallback to local responses if API fails)
      const aiResponse = await callGeminiAPI(message);
      console.log('Received AI response:', aiResponse);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      };

      setAiMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting to the AI service. Using local knowledge instead: " + await simulateAIResponse(message),
        isUser: false,
        timestamp: new Date()
      };
      setAiMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Execute action commands (add project, delete project, etc.)
  const executeActionIfCommand = async (message: string): Promise<string | null> => {
    const lowerMessage = message.toLowerCase();

    // Detect production statistics queries
    if ((lowerMessage.includes('how many') && lowerMessage.includes('produced')) ||
        lowerMessage.includes('production') && (lowerMessage.includes('month') || lowerMessage.includes('week') || lowerMessage.includes('day')) ||
        lowerMessage.includes('blocks produced') ||
        lowerMessage.includes('total production')) {
      return await handleProductionStatsQuery(message);
    }

    // Detect "add project" command
    if (lowerMessage.includes('add project') || lowerMessage.includes('create project') || lowerMessage.includes('new project')) {
      return await handleAddProjectCommand(message);
    }

    // Detect "add manual project" or "start manual project" command
    if (lowerMessage.includes('manual project') || lowerMessage.includes('start process') || lowerMessage.includes('start manual')) {
      return await handleAddManualProjectCommand(message);
    }

    // Detect "delete project" command
    if (lowerMessage.includes('delete project') || lowerMessage.includes('remove project')) {
      return await handleDeleteProjectCommand(message);
    }

    // Detect block prediction queries
    if ((lowerMessage.includes('how many blocks') || lowerMessage.includes('predict blocks') || lowerMessage.includes('calculate blocks') || lowerMessage.includes('blocks needed'))
        && (lowerMessage.includes('sqm') || lowerMessage.includes('square meter') || lowerMessage.includes('m²') || lowerMessage.includes('m2'))) {
      return await handleBlockPredictionCommand(message);
    }

    // No command detected
    return null;
  };

  // Handle production statistics queries
  const handleProductionStatsQuery = async (message: string): Promise<string> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return "❌ You must be signed in to view production statistics. Please log in first.";
      }

      const stats = await getProductionStats(message);
      return stats;
    } catch (error: any) {
      console.error('Error fetching production stats:', error);
      return `❌ Failed to fetch production statistics: ${error.message || 'Unknown error'}`;
    }
  };

  // Get production statistics based on query
  const getProductionStats = async (message: string): Promise<string> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return "❌ Not logged in";
      }

      // Query Firebase projects
      const projectsRef = collection(db, 'projects');
      const allProjectsQuery = query(
        projectsRef,
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(allProjectsQuery);
      const projects: any[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        projects.push({
          id: doc.id,
          name: data.name,
          blocks: data.blocks || 0,
          status: data.status,
          date: data.date,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        });
      });

      // Determine time period from message
      const lowerMessage = message.toLowerCase();
      const now = new Date();
      let startDate: Date;
      let timeLabel: string;

      if (lowerMessage.includes('today') || lowerMessage.includes('this day')) {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        timeLabel = 'Today';
      } else if (lowerMessage.includes('week')) {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        timeLabel = 'This Week';
      } else if (lowerMessage.includes('month')) {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        timeLabel = 'This Month';
      } else if (lowerMessage.includes('year')) {
        startDate = new Date(now.getFullYear(), 0, 1);
        timeLabel = 'This Year';
      } else {
        // Default to month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        timeLabel = 'This Month';
      }

      // Filter projects by date and status
      const filteredProjects = projects.filter(p => {
        const projectDate = new Date(p.createdAt);
        return projectDate >= startDate && p.status === 'Completed';
      });

      const totalBlocks = filteredProjects.reduce((sum, p) => sum + (p.blocks || 0), 0);
      const projectCount = filteredProjects.length;

      if (projectCount === 0) {
        return `📊 Production Statistics - ${timeLabel}\n\nNo completed projects found for this period.\n\nStart creating projects to begin tracking your RHA block production! 🚀`;
      }

      // Calculate average blocks per project
      const avgBlocksPerProject = Math.round(totalBlocks / projectCount);

      // Get top project
      const topProject = filteredProjects.reduce((max, p) =>
        (p.blocks > (max?.blocks || 0)) ? p : max
      );

      return `📊 Production Statistics - ${timeLabel}\n\n✅ **Completed Projects:** ${projectCount}\n📦 **Total Blocks Produced:** ${totalBlocks.toLocaleString()}\n📈 **Average per Project:** ${avgBlocksPerProject} blocks\n🏆 **Largest Project:** ${topProject.name} (${topProject.blocks} blocks)\n\nGreat progress on your RHA block production! 🌾`;
    } catch (error: any) {
      console.error('Error calculating production stats:', error);
      return `❌ Failed to calculate statistics: ${error.message || 'Unknown error'}`;
    }
  };

  // Handle "add project" command
  const handleAddProjectCommand = async (message: string): Promise<string> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return "❌ You must be signed in to add projects. Please log in first.";
      }

      // Extract project name and blocks from message
      const projectInfo = extractProjectInfo(message);
      
      if (!projectInfo.name || !projectInfo.blocks) {
        return "❌ I couldn't extract the project details. Please provide:\n\n📝 Project name\n📦 Number of blocks\n\nExample: 'Add project named Sample Project with 100 blocks'";
      }

      // Validate blocks
      if (projectInfo.blocks <= 0) {
        return "❌ Number of blocks must be greater than 0.";
      }

      // Calculate estimated time (1 block = 1 minute)
      const totalMinutes = projectInfo.blocks;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const estimatedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

      // Create project in Firebase
      const projectData = {
        name: projectInfo.name,
        blocks: projectInfo.blocks,
        estimatedTime: estimatedTime,
        date: new Date().toLocaleDateString('en-GB'),
        status: 'Queue' as const,
        userId: currentUser.uid
      };

      const projectId = await firebaseService.createProject(projectData as any);

      return `✅ Project created successfully!\n\n📝 Name: ${projectInfo.name}\n📦 Blocks: ${projectInfo.blocks}\n⏱️ Estimated Time: ${estimatedTime}\n📊 Status: Queue\n\nThe project has been added to your queue and will start automatically when ready!`;
    } catch (error: any) {
      console.error('Error adding project via AI:', error);
      return `❌ Failed to add project: ${error.message || 'Unknown error'}`;
    }
  };

  // Handle "delete project" command
  const handleDeleteProjectCommand = async (message: string): Promise<string> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return "❌ You must be signed in to delete projects. Please log in first.";
      }

      // Extract project name from message
      const projectName = extractProjectNameForDeletion(message);
      
      if (!projectName) {
        return "❌ I couldn't identify which project to delete. Please specify the project name.\n\nExample: 'Delete project named Sample Project'";
      }

      // Find the project by name
      const projects = await firebaseService.getProjects(currentUser.uid);
      const projectToDelete = projects.find(p => 
        p.name.toLowerCase().includes(projectName.toLowerCase())
      );

      if (!projectToDelete) {
        return `❌ I couldn't find a project with the name "${projectName}". Please check the project name and try again.`;
      }

      // Delete the project
      await firebaseService.deleteProject(projectToDelete.id);

      return `✅ Project deleted successfully!\n\n📝 Name: ${projectToDelete.name}\n📦 Blocks: ${projectToDelete.blocks}\n\nThe project has been removed from your list.`;
    } catch (error: any) {
      console.error('Error deleting project via AI:', error);
      return `❌ Failed to delete project: ${error.message || 'Unknown error'}`;
    }
  };

  // Handle "add manual project" command (for dashboard manual projects)
  const handleAddManualProjectCommand = async (message: string): Promise<string> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return "❌ You must be signed in to create manual projects. Please log in first.";
      }

      // Extract project name and blocks from message
      const projectInfo = extractProjectInfo(message);
      
      if (!projectInfo.name || !projectInfo.blocks) {
        return "❌ I couldn't extract the project details. Please provide:\n\n📝 Project name\n📦 Number of blocks\n\nExample: 'Start manual project named Sample with 100 blocks'";
      }

      // Validate blocks
      if (projectInfo.blocks <= 0) {
        return "❌ Number of blocks must be greater than 0.";
      }

      // Calculate estimated time (1 block = 1 minute)
      const totalMinutes = projectInfo.blocks;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const estimatedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

      // Convert time string to seconds
      const timeStringToSeconds = (timeString: string): number => {
        const [hours, minutes, seconds] = timeString.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds;
      };

      const totalSeconds = timeStringToSeconds(estimatedTime);
      const currentDate = new Date().toLocaleDateString('en-GB');
      const now = new Date();

      // Create manual project in Firebase
      const manualProjectData = {
        name: projectInfo.name,
        blocks: projectInfo.blocks,
        estimatedTime: estimatedTime,
        remainingTime: totalSeconds,
        date: currentDate,
        status: 'Processing',
        userId: currentUser.uid,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        isManual: true,
        timerActive: true, // Hardware reads this field
      };

      await addDoc(collection(db, 'manual_projects'), manualProjectData);

      return `✅ Manual project started successfully!\n\n📝 Name: ${projectInfo.name}\n📦 Blocks: ${projectInfo.blocks}\n⏱️ Estimated Time: ${estimatedTime}\n⚙️ Status: Processing\n\n🎯 The timer is now running! You can see it on the Dashboard.\n\nThe hardware will read this timer and control the mixing process automatically.`;
    } catch (error: any) {
      console.error('Error creating manual project via AI:', error);
      return `❌ Failed to create manual project: ${error.message || 'Unknown error'}`;
    }
  };

  // Extract project information from natural language
  const extractProjectInfo = (message: string): { name: string | null; blocks: number | null } => {
    let name: string | null = null;
    let blocks: number | null = null;

    // Extract project name (look for patterns like "named X", "called X", "name: X")
    const namePatterns = [
      /(?:named|called|name:|project name:)\s*([^,\n]+?)(?:\s+with|\s+\d+|$)/i,
      /project\s+([^,\n]+?)\s+with\s+\d+/i,
      /add\s+([^,\n]+?)\s+with\s+\d+/i
    ];

    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        name = match[1].trim();
        break;
      }
    }

    // Extract number of blocks (look for patterns like "100 blocks", "blocks: 100", "with 100")
    const blocksPatterns = [
      /(\d+)\s*(?:blocks?|hollow blocks?|rha blocks?)/i,
      /(?:blocks?:|produce:?)\s*(\d+)/i,
      /with\s+(\d+)/i,
      /\b(\d+)\b/
    ];

    for (const pattern of blocksPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const parsedBlocks = parseInt(match[1]);
        if (!isNaN(parsedBlocks) && parsedBlocks > 0) {
          blocks = parsedBlocks;
          break;
        }
      }
    }

    return { name, blocks };
  };

  // Extract project name for deletion
  const extractProjectNameForDeletion = (message: string): string | null => {
    const patterns = [
      /(?:delete|remove)\s+(?:project\s+)?(?:named|called)?\s*([^,\n]+?)(?:\s*$)/i,
      /(?:named|called)\s+([^,\n]+)/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  };

  // Handle block prediction queries
  const handleBlockPredictionCommand = async (message: string): Promise<string> => {
    try {
      // Extract parameters from message
      const params = extractConstructionParams(message);
      
      if (!params.squareMeters || !params.height || !params.rooms) {
        return "❌ I need more information to predict blocks needed. Please provide:\n\n📐 Square meters (floor area)\n📏 Wall height in meters\n🏠 Number of rooms\n\nExample: 'How many blocks for 100 sqm, 3 rooms, 3m height?'";
      }

      // Calculate blocks needed
      const result = calculateBlocksNeeded(params.squareMeters, params.height, params.rooms);
      
      // Calculate cost comparison (RHA vs Normal hollow blocks)
      const rhaPricePerBlock = 13.6; // RHA Hollow Block price
      const normalPricePerBlock = 14.0; // Normal Hollow Block price
      const rhaTotalCost = result.totalBlocks * rhaPricePerBlock;
      const normalTotalCost = result.totalBlocks * normalPricePerBlock;
      const savings = normalTotalCost - rhaTotalCost;
      const savingsPercentage = ((savings / normalTotalCost) * 100).toFixed(1);
      
      // Production time estimate
      const productionHours = Math.ceil(result.totalBlocks / 60);
      const productionMinutes = result.totalBlocks % 60;
      
      // Generate natural response using Gemini API
      const geminiResponse = await generateBlockPredictionResponse({
        squareMeters: params.squareMeters,
        rooms: params.rooms,
        height: params.height,
        totalBlocks: result.totalBlocks,
        wallArea: result.wallArea,
        perimeterLength: result.perimeterLength,
        rhaPricePerBlock: rhaPricePerBlock,
        normalPricePerBlock: normalPricePerBlock,
        rhaTotalCost: rhaTotalCost,
        normalTotalCost: normalTotalCost,
        savings: savings,
        savingsPercentage: savingsPercentage,
        productionHours: productionHours,
        productionMinutes: productionMinutes
      });
      
      return geminiResponse;
    } catch (error: any) {
      console.error('Error calculating blocks:', error);
      return `❌ Failed to calculate blocks: ${error.message || 'Unknown error'}`;
    }
  };

  // Generate natural response for block prediction using Gemini API
  const generateBlockPredictionResponse = async (data: {
    squareMeters: number;
    rooms: number;
    height: number;
    totalBlocks: number;
    wallArea: number;
    perimeterLength: number;
    rhaPricePerBlock: number;
    normalPricePerBlock: number;
    rhaTotalCost: number;
    normalTotalCost: number;
    savings: number;
    savingsPercentage: string;
    productionHours: number;
    productionMinutes: number;
  }): Promise<string> => {
    const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
    
    try {
      const prompt = `You are Husky, a friendly and knowledgeable RiCement AI assistant. A user asked about block requirements for their construction project.

Project Details:
- Floor Area: ${data.squareMeters} square meters
- Number of Rooms: ${data.rooms}
- Wall Height: ${data.height} meters

Calculation Results (YOU MUST INCLUDE THESE EXACT NUMBERS):
- Net Wall Area: ${data.wallArea.toFixed(2)} m²
- Total Perimeter: ${data.perimeterLength.toFixed(2)} m
- Blocks Needed: ${data.totalBlocks.toLocaleString()} blocks (includes 7.5% wastage allowance)

Cost Comparison (MUST INCLUDE BOTH):
- RHA Hollow Blocks: ₱${data.rhaPricePerBlock.toFixed(2)} per block
  Total: ₱${data.rhaTotalCost.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Normal Hollow Blocks: ₱${data.normalPricePerBlock.toFixed(2)} per block
  Total: ₱${data.normalTotalCost.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Savings with RHA: ₱${data.savings.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${data.savingsPercentage}% cheaper!)

Production Time: ${data.productionHours} hours ${data.productionMinutes} minutes (at 1 block/minute)

Task: Generate a natural, conversational response that:
1. Acknowledges their project with enthusiasm
2. Presents ALL the calculation results clearly (use the exact numbers above)
3. HIGHLIGHT the cost comparison - emphasize how much they save by using RHA blocks instead of normal blocks
4. Adds helpful context about the project size (is it small/medium/large?)
5. Includes a practical tip or insight about RHA hollow blocks and their eco-friendly benefits
6. Sounds friendly and helpful, not robotic

Format the response in a clear structure with proper spacing and emojis, but make the narrative feel natural and conversational. Don't use a fixed template - vary your approach based on the project size and details. Make sure to emphasize the cost savings!`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 400,
            stopSequences: [],
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const responseData = await response.json();
      
      if (responseData.candidates && responseData.candidates.length > 0) {
        const candidate = responseData.candidates[0];
        
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const text = candidate.content.parts[0].text;
          if (text && text.trim()) {
            return text.trim();
          }
        }
      }
      
      // Fallback if API fails
      throw new Error('No response from API');
      
    } catch (error) {
      console.error('Gemini API Error for block prediction:', error);
      
      // Fallback to structured response if API fails
      return `📊 Block Prediction for Your Project:\n\n🏗️ Project Specifications:\n• Floor Area: ${data.squareMeters} m²\n• Number of Rooms: ${data.rooms}\n• Wall Height: ${data.height} m\n\n📦 Blocks Required:\n• Net Wall Area: ${data.wallArea.toFixed(2)} m²\n• Total Perimeter: ${data.perimeterLength.toFixed(2)} m\n• **Blocks Needed: ${data.totalBlocks.toLocaleString()} blocks**\n  (includes 7.5% wastage allowance)\n\n💰 Cost Comparison:\n\n🌾 **RHA Hollow Blocks (Recommended)**\n• Price: ₱${data.rhaPricePerBlock.toFixed(2)} per block\n• **Total Cost: ₱${data.rhaTotalCost.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**\n\n🏗️ Normal Hollow Blocks\n• Price: ₱${data.normalPricePerBlock.toFixed(2)} per block\n• Total Cost: ₱${data.normalTotalCost.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n💚 **You Save: ₱${data.savings.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${data.savingsPercentage}% cheaper!)**\n\n⏱️ Production Estimate:\n• Time: ${data.productionHours} hours ${data.productionMinutes} minutes\n  (at 1 block/minute)\n\n💡 Tip: RHA blocks are not only cheaper but also eco-friendly and provide better thermal insulation! This calculation assumes standard hollow blocks (40×20×15cm) with 12.5 blocks per m².`;
    }
  };

  // Extract construction parameters from natural language
  const extractConstructionParams = (message: string): { squareMeters: number | null; height: number | null; rooms: number | null } => {
    let squareMeters: number | null = null;
    let height: number | null = null;
    let rooms: number | null = null;

    // Extract square meters
    const sqmPatterns = [
      /(\d+(?:\.\d+)?)\s*(?:sqm|square meter|m²|m2|square)/i,
      /(\d+(?:\.\d+)?)\s*m²/i,
    ];
    
    for (const pattern of sqmPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const parsed = parseFloat(match[1]);
        if (!isNaN(parsed) && parsed > 0) {
          squareMeters = parsed;
          break;
        }
      }
    }

    // Extract height
    const heightPatterns = [
      /(\d+(?:\.\d+)?)\s*(?:m|meter|metre)(?:\s+height|\s+wall|\s+high)?/i,
      /height[:\s]+(\d+(?:\.\d+)?)/i,
      /(\d+(?:\.\d+)?)\s*(?:meter|metre)\s+(?:height|tall|high)/i,
    ];
    
    for (const pattern of heightPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const parsed = parseFloat(match[1]);
        if (!isNaN(parsed) && parsed > 0 && parsed < 10) { // reasonable height limit
          height = parsed;
          break;
        }
      }
    }

    // Extract number of rooms
    const roomPatterns = [
      /(\d+)\s*(?:rooms?|bedrooms?|br)/i,
      /(?:rooms?|bedrooms?)[\s:]+(\d+)/i,
    ];
    
    for (const pattern of roomPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const parsed = parseInt(match[1]);
        if (!isNaN(parsed) && parsed > 0 && parsed < 50) { // reasonable room limit
          rooms = parsed;
          break;
        }
      }
    }

    return { squareMeters, height, rooms };
  };

  // Calculate blocks needed for construction project
  const calculateBlocksNeeded = (squareMeters: number, height: number, numberOfRooms: number) => {
    // Average room size
    const avgRoomSize = squareMeters / numberOfRooms;
    
    // Estimate perimeter (assuming roughly square rooms)
    const sideLength = Math.sqrt(avgRoomSize);
    const perimeterPerRoom = sideLength * 4;
    const totalPerimeter = perimeterPerRoom * numberOfRooms;
    
    // Account for shared walls (reduce by 15%)
    const adjustedPerimeter = totalPerimeter * 0.85;
    
    // Calculate wall area
    const totalWallArea = adjustedPerimeter * height;
    
    // Subtract openings (1 door + 1 window per room average)
    const doorArea = 2.0; // 2.0 m² per door
    const windowArea = 1.5; // 1.5 m² per window
    const openingsArea = numberOfRooms * (doorArea + windowArea);
    const netWallArea = Math.max(0, totalWallArea - openingsArea);
    
    // Blocks per square meter (standard hollow block 40×20×15cm)
    const blocksPerSqM = 12.5;
    
    // Total blocks needed
    const totalBlocks = Math.ceil(netWallArea * blocksPerSqM);
    
    // Add 7.5% wastage
    const withWastage = Math.ceil(totalBlocks * 1.075);
    
    return {
      totalBlocks: withWastage,
      wallArea: netWallArea,
      perimeterLength: adjustedPerimeter
    };
  };

  // Call Google Gemini API
  const callGeminiAPI = async (userMessage: string): Promise<string> => {
    const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
    
    try {
      // Get current material status and Firebase project data for context
      const materialStatus = await getMaterialStatus();
      const projectData = await getFirebaseProjectData();
      
      const systemContext = `You are a RiCement AI assistant for RHA concrete production.

Current Status: ${materialStatus}

${projectData}

I can execute actions for you! Available commands:
• "Add project named [name] with [number] blocks" - Creates a new project in queue
• "Start manual project named [name] with [number] blocks" - Creates a manual project with active timer
• "Delete project named [name]" - Removes a project
• "How many blocks for [X] sqm, [Y] rooms, [Z]m height?" - Predicts blocks needed and cost (₱13.6/block)

Give concise technical advice on RHA concrete, materials, quality control, and production insights based on the project data.
If the user asks about adding or managing projects, remind them they can use commands like the examples above.

Q: ${userMessage}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: systemContext
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 200,
            stopSequences: [],
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response Error:', response.status, errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        console.error('Gemini API Error:', data.error);
        throw new Error(`Gemini API Error: ${data.error.message || 'Unknown error'}`);
      }
      
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const text = candidate.content.parts[0].text;
          if (text && text.trim()) {
            return text.trim();
          }
        }
        
        if (candidate.finishReason === 'MAX_TOKENS') {
          if (candidate.content && candidate.content.parts && candidate.content.parts[0] && candidate.content.parts[0].text) {
            return candidate.content.parts[0].text.trim() + "\n\n(Response was truncated due to length. Ask for more details if needed!)";
          }
          return "I have a response for you, but it was cut short due to length limits. Could you ask a more specific question?";
        }
        
        if (candidate.finishReason === 'SAFETY') {
          return "I apologize, but I cannot provide a response to that query due to safety guidelines. Please try rephrasing your question.";
        }
      }
      
      console.error('Could not extract text from API response:', data);
      throw new Error('Unable to extract response text from API');
    } catch (error) {
      console.error('Gemini API Error:', error);
      return simulateAIResponse(userMessage);
    }
  };

  // Get material status from storage for AI context
  const getMaterialStatus = async (): Promise<string> => {
    try {
      const savedProjects = await AsyncStorage.getItem('projects');
      let todayBlocks = 0;
      
      if (savedProjects) {
        const projects = JSON.parse(savedProjects);
        const completedProjects = projects.filter((p: any) => p.status === 'Completed');
        const today = new Date().toLocaleDateString('en-GB');
        
        todayBlocks = completedProjects
          .filter((project: any) => project.date === today)
          .reduce((total: number, project: any) => total + project.blocks, 0);
      }
      
      return `RHA:95%, Sand:60%, Cement:90%, Gravel:20%(LOW), Water:95%, Temp:30°C, Today:${todayBlocks} blocks`;
    } catch (error) {
      return 'RHA:95%, Sand:60%, Cement:90%, Gravel:20%(LOW), Water:95%, Temp:30°C, Today:0 blocks';
    }
  };

  // Get Firebase project data for AI analysis
  const getFirebaseProjectData = async (): Promise<string> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return 'No user logged in';
      }

      // Query projects from Firebase
      const projectsQuery = query(
        collection(db, 'projects'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(20) // Get last 20 projects for analysis
      );

      const querySnapshot = await getDocs(projectsQuery);
      const projects: any[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        projects.push({
          id: doc.id,
          name: data.name,
          blocks: data.blocks,
          status: data.status,
          date: data.date,
          estimatedTime: data.estimatedTime,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        });
      });

      if (projects.length === 0) {
        return 'No projects found in database';
      }

      // Calculate statistics
      const totalProjects = projects.length;
      const completedProjects = projects.filter(p => p.status === 'Completed').length;
      const pendingProjects = projects.filter(p => p.status === 'Pending').length;
      const inProgressProjects = projects.filter(p => p.status === 'In Progress').length;
      const totalBlocks = projects.reduce((sum, p) => sum + (p.blocks || 0), 0);
      const avgBlocksPerProject = totalProjects > 0 ? Math.round(totalBlocks / totalProjects) : 0;

      // Get today's production
      const today = new Date().toLocaleDateString('en-GB');
      const todayProjects = projects.filter(p => p.date === today);
      const todayBlocks = todayProjects.reduce((sum, p) => sum + (p.blocks || 0), 0);

      // Get this week's production
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekProjects = projects.filter(p => {
        const projectDate = p.createdAt;
        return projectDate >= weekAgo;
      });
      const weekBlocks = weekProjects.reduce((sum, p) => sum + (p.blocks || 0), 0);

      // Recent project details (last 5)
      const recentProjects = projects.slice(0, 5).map(p => 
        `${p.name}: ${p.blocks} blocks (${p.status})`
      ).join('; ');

      return `Firebase Projects Analysis:
Total: ${totalProjects} projects (${completedProjects} completed, ${inProgressProjects} in progress, ${pendingProjects} pending)
Production: ${totalBlocks} total blocks, avg ${avgBlocksPerProject}/project
Today: ${todayBlocks} blocks from ${todayProjects.length} projects
This Week: ${weekBlocks} blocks from ${weekProjects.length} projects
Recent Projects: ${recentProjects || 'None'}`;

    } catch (error) {
      console.error('Error fetching Firebase project data:', error);
      return 'Unable to fetch project data from Firebase';
    }
  };

  // Fallback local responses
  const simulateAIResponse = async (userMessage: string): Promise<string> => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('rha') || message.includes('rice husk ash')) {
      return "Rice Husk Ash (RHA) is an excellent supplementary cementitious material! It improves concrete strength, reduces permeability, and makes your RiCement blocks more durable. The optimal replacement rate is typically 10-20% of cement weight.";
    }
    
    if (message.includes('temperature') || message.includes('temp')) {
      return "For optimal RHA concrete production, maintain temperatures between 25-35°C during mixing and curing. The current machine temperature of 30°C is perfect for your production process!";
    }
    
    if (message.includes('blocks') || message.includes('production')) {
      return "Based on your current data, you're producing great quality RHA hollow blocks! Remember to maintain proper curing conditions and check material ratios regularly for consistent quality.";
    }
    
    if (message.includes('materials') || message.includes('raw materials')) {
      return "I see your gravel levels are low (20%). Consider restocking soon to avoid production delays. Your RHA and water levels look excellent at 95%!";
    }
    
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return "Hello! I'm your RiCement AI assistant. I can help you with questions about RHA concrete production, material management, quality control, and process optimization.\n\n✨ I can also execute commands! Try:\n• \"Add project named Sample with 100 blocks\" - Queue project\n• \"Start manual project named Test with 50 blocks\" - Active timer\n• \"Delete project named Sample\"\n\nWhat would you like to know?";
    }
    
    if (message.includes('add') || message.includes('create') || message.includes('command') || message.includes('manual')) {
      return "I can execute commands for you! Here are some examples:\n\n📝 Add a queue project:\n\"Add project named Sample Project with 100 blocks\"\n\n⚙️ Start a manual project (with active timer):\n\"Start manual project named Test Batch with 50 blocks\"\n\n🗑️ Delete a project:\n\"Delete project named Sample Project\"\n\n📊 Predict blocks & cost:\n\"How many blocks for 100 sqm, 3 rooms, 3m height?\"\n\nJust tell me what you'd like to do!";
    }
    
    if (message.includes('predict') || message.includes('calculate') || message.includes('how many') || message.includes('cost') || message.includes('price')) {
      return "I can predict how many blocks you'll need for your construction project! Just tell me:\n\n📐 Floor area in square meters\n🏠 Number of rooms\n📏 Wall height in meters\n\nFor example: \"How many blocks for 100 sqm, 3 rooms, 3m height?\"\n\nI'll calculate the exact number of RHA hollow blocks needed, total cost (at ₱13.6 per block), and production time!";
    }
    
    return "I'm here to help with your RiCement production! Feel free to ask about RHA concrete mixing, material ratios, quality control, or any technical questions about your hollow block production process.\n\n✨ I can also execute commands like adding projects, predicting blocks, and more!";
  };

  // Initialize AI chat with welcome message
  const initializeAIChat = () => {
    if (aiMessages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        text: "Hi! I'm Husky! not the dramatic one.. I'm your RiCement AI assistant. 🐕\n\nI can help you with:\n• RHA concrete production advice\n• Material management tips\n• Quality control guidance\n\n✨ I can also execute commands!\n• \"Add project named [name] with [number] blocks\" - Queue project\n• \"Start manual project named [name] with [number] blocks\" - Active timer\n• \"Delete project named [name]\"\n\nHow can I assist you today?",
        isUser: false,
        timestamp: new Date()
      };
      setAiMessages([welcomeMessage]);
    }
  };

  return (
    <>
      {/* Floating AI Chat Bubble */}
      <Pressable 
        style={styles.floatingChatBubble}
        onPress={() => {
          setIsAiChatVisible(true);
          initializeAIChat();
        }}
      >
        <Ionicons name="chatbubble" size={28} color="#FFFFFF" />
      </Pressable>

      {/* AI Chat Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAiChatVisible}
        onRequestClose={() => setIsAiChatVisible(false)}
      >
        <View style={styles.aiChatModalOverlay}>
          <View style={styles.aiChatModalContent}>
            <View style={styles.aiChatHeader}>
              <View style={styles.aiChatHeaderLeft}>
                <View style={styles.aiAvatar}>
                  <Ionicons name="hardware-chip" size={24} color="#007AFF" />
                </View>
                <View>
                  <ThemedText style={styles.aiChatTitle}>Husky</ThemedText>
                  <ThemedText style={styles.aiChatStatus}>
                    {isAiTyping ? 'Typing...' : 'Online'}
                  </ThemedText>
                </View>
              </View>
              <Pressable 
                onPress={() => setIsAiChatVisible(false)}
                style={styles.aiChatCloseButton}
              >
                <Ionicons name="close" size={20} color="#8E8E93" />
              </Pressable>
            </View>

            {/* FAQ Buttons */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.faqButtonsContainer}
              contentContainerStyle={styles.faqButtonsContent}
            >
              {FAQs.map((faq) => (
                <Pressable
                  key={faq.id}
                  style={styles.faqButton}
                  onPress={() => handleFAQPress(faq)}
                >
                  <ThemedText style={styles.faqButtonText}>{faq.question}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>

            <ScrollView
              style={styles.aiChatMessages}
              showsVerticalScrollIndicator={false}
              ref={(ref) => ref?.scrollToEnd({ animated: true })}
            >
              {aiMessages.map((message) => (
                <View 
                  key={message.id} 
                  style={[
                    styles.aiMessageContainer,
                    message.isUser ? styles.userMessageContainer : styles.aiMessageContainer
                  ]}
                >
                  <View 
                    style={[
                      styles.aiMessageBubble,
                      message.isUser ? styles.userMessageBubble : styles.aiMessageBubbleStyle
                    ]}
                  >
                    {renderTextWithBold(message.text, message.isUser)}
                  </View>
                  <ThemedText style={styles.aiMessageTime}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </ThemedText>
                </View>
              ))}
              
              {isAiTyping && (
                <View style={styles.aiMessageContainer}>
                  <View style={styles.aiMessageBubbleStyle}>
                    <View style={styles.typingIndicator}>
                      <View style={[styles.typingDot, { animationDelay: '0ms' }]} />
                      <View style={[styles.typingDot, { animationDelay: '200ms' }]} />
                      <View style={[styles.typingDot, { animationDelay: '400ms' }]} />
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
            
            <View style={styles.aiChatInputContainer}>
              <TextInput
                style={styles.aiChatInput}
                value={aiChatInput}
                onChangeText={setAiChatInput}
                placeholder="Ask me anything about RiCement..."
                placeholderTextColor="#8E8E93"
                multiline
                maxLength={500}
              />
              <Pressable 
                style={[
                  styles.aiSendButton,
                  { opacity: aiChatInput.trim() ? 1 : 0.5 }
                ]}
                onPress={() => sendMessageToAI(aiChatInput)}
                disabled={!aiChatInput.trim() || isAiTyping}
              >
                <Ionicons name="send" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Floating AI Chat Bubble
  floatingChatBubble: {
    position: 'absolute',
    bottom: 100, // Positioned above tab bar
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  // AI Chat Modal Styles
  aiChatModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  aiChatModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '80%',
    padding: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  aiChatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  aiChatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiChatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  aiChatStatus: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
    marginTop: 2,
  },
  aiChatCloseButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    padding: 8,
  },
  aiChatMessages: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  aiMessageContainer: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageBubbleStyle: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 20,
    borderTopLeftRadius: 8,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userMessageBubble: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 20,
    borderTopRightRadius: 8,
    maxWidth: '80%',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  aiMessageBubble: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 20,
    borderTopLeftRadius: 8,
    maxWidth: '80%',
  },
  aiMessageTextStyle: {
    color: '#1C1C1E',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  userMessageText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  aiMessageText: {
    color: '#1C1C1E',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  aiMessageTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    marginHorizontal: 4,
  },
  aiChatInputContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'flex-end',
  },
  aiChatInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginRight: 12,
  },
  aiSendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  // Typing Indicator
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8E8E93',
    marginHorizontal: 2,
    opacity: 0.4,
  },
  // FAQ Buttons
  faqButtonsContainer: {
    maxHeight: 100,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  faqButtonsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  faqButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    justifyContent: 'center',
  },
  faqButtonText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
    lineHeight: 16,
  },
});