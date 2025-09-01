import { eq, desc, sum, and, sql } from "drizzle-orm";
import { db } from "../config/db.js";
import { accounts, ledgerEntries, transactions, accountBalances, auditTrail } from "../model/ledger.js";

// Create a double-entry transaction
export const createTransaction = async (req: any, res: any) => {
  try {
    const { 
      description, 
      type, 
      userId, 
      entries, // Array of {accountId, debitAmount?, creditAmount?, description}
      referenceId,
      metadata 
    } = req.body;

    if (!entries || entries.length < 2) {
      return res.status(400).json({
        success: false,
        error: "At least 2 entries required for double-entry transaction",
        timestamp: new Date().toISOString()
      });
    }

    // Validate that debits equal credits
    let totalDebits = 0;
    let totalCredits = 0;

    entries.forEach((entry: any) => {
      totalDebits += parseFloat(entry.debitAmount || 0);
      totalCredits += parseFloat(entry.creditAmount || 0);
    });

    if (Math.abs(totalDebits - totalCredits) > 0.00000001) { // Allow for floating point precision
      return res.status(400).json({
        success: false,
        error: "Debits must equal credits in double-entry bookkeeping",
        details: { totalDebits, totalCredits },
        timestamp: new Date().toISOString()
      });
    }

    // Create transaction header
    const transactionResult = await db
      .insert(transactions)
      .values({
        description,
        type,
        userId,
        totalAmount: totalDebits.toFixed(8),
        referenceId,
        metadata
      })
      .returning();
    
    const transaction = transactionResult[0];

    // Create ledger entries
    const ledgerEntriesData = entries.map((entry: any) => ({
      transactionId: transaction.id,
      userId: userId,
      accountId: entry.accountId,
      debitAmount: (entry.debitAmount || 0).toFixed(8),
      creditAmount: (entry.creditAmount || 0).toFixed(8),
      description: entry.description || description,
      referenceType: type,
      referenceId: referenceId,
      metadata: entry.metadata
    }));

    const createdEntries = await db
      .insert(ledgerEntries)
      .values(ledgerEntriesData)
      .returning();

    // Update account balances
    for (const entry of entries) {
      await updateAccountBalance(entry.accountId, userId, entry.debitAmount || 0, entry.creditAmount || 0);
    }

    return res.status(201).json({
      success: true,
      data: {
        transaction,
        entries: createdEntries
      },
      message: "Transaction created successfully"
    });
  } catch (error: any) {
    console.error("Create transaction error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
};

// Helper function to update account balances
const updateAccountBalance = async (accountId: string, userId?: string, debitAmount: number = 0, creditAmount: number = 0) => {
  // Get existing balance
  const [existingBalance] = await db
    .select()
    .from(accountBalances)
    .where(and(
      eq(accountBalances.accountId, accountId),
      userId ? eq(accountBalances.userId, userId) : sql`${accountBalances.userId} IS NULL`
    ));

  const newDebitBalance = (parseFloat(existingBalance?.debitBalance || '0') + debitAmount).toFixed(8);
  const newCreditBalance = (parseFloat(existingBalance?.creditBalance || '0') + creditAmount).toFixed(8);
  const newNetBalance = (parseFloat(newDebitBalance) - parseFloat(newCreditBalance)).toFixed(8);

  if (existingBalance) {
    await db
      .update(accountBalances)
      .set({
        debitBalance: newDebitBalance,
        creditBalance: newCreditBalance,
        netBalance: newNetBalance,
        lastUpdated: new Date(),
      })
      .where(eq(accountBalances.id, existingBalance.id));
  } else {
    await db
      .insert(accountBalances)
      .values({
        accountId,
        userId,
        debitBalance: newDebitBalance,
        creditBalance: newCreditBalance,
        netBalance: newNetBalance,
      });
  }
};

// Get account balance
export const getAccountBalance = async (req: any, res: any) => {
  try {
    const { accountId } = req.params;
    const { userId } = req.query;

    const [balance] = await db
      .select()
      .from(accountBalances)
      .where(and(
        eq(accountBalances.accountId, accountId),
        userId ? eq(accountBalances.userId, userId) : sql`${accountBalances.userId} IS NULL`
      ));

    return res.status(200).json({
      success: true,
      data: balance || {
        accountId,
        userId: userId || null,
        debitBalance: '0.00000000',
        creditBalance: '0.00000000',
        netBalance: '0.00000000'
      },
      message: "Account balance retrieved successfully"
    });
  } catch (error: any) {
    console.error("Get account balance error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
};

// Get all accounts
export const getAccounts = async (req: any, res: any) => {
  try {
    const { type, active = true } = req.query;

    let whereConditions = [];
    if (active === 'true') {
      whereConditions.push(eq(accounts.isActive, true));
    }
    if (type) {
      whereConditions.push(eq(accounts.type, type));
    }

    const accountsList = await db
      .select()
      .from(accounts)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(accounts.code);

    return res.status(200).json({
      success: true,
      data: accountsList,
      message: "Accounts retrieved successfully"
    });
  } catch (error: any) {
    console.error("Get accounts error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
};

// Get transaction history
export const getTransactionHistory = async (req: any, res: any) => {
  try {
    const { page = 1, limit = 20, userId, type } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereConditions = [];
    if (userId) {
      whereConditions.push(eq(transactions.userId, userId));
    }
    if (type) {
      whereConditions.push(eq(transactions.type, type));
    }

    const transactionList = await db
      .select()
      .from(transactions)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(transactions.transactionDate))
      .limit(parseInt(limit))
      .offset(offset);

    // Get entries for each transaction
    const transactionsWithEntries = await Promise.all(
      transactionList.map(async (transaction) => {
        const entries = await db
          .select({
            id: ledgerEntries.id,
            accountId: ledgerEntries.accountId,
            accountName: accounts.name,
            accountCode: accounts.code,
            debitAmount: ledgerEntries.debitAmount,
            creditAmount: ledgerEntries.creditAmount,
            description: ledgerEntries.description,
          })
          .from(ledgerEntries)
          .innerJoin(accounts, eq(ledgerEntries.accountId, accounts.id))
          .where(eq(ledgerEntries.transactionId, transaction.id));

        return {
          ...transaction,
          entries
        };
      })
    );

    const totalCount = await db
      .select({ count: sql`count(*)` })
      .from(transactions)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    return res.status(200).json({
      success: true,
      data: {
        transactions: transactionsWithEntries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount[0].count,
          totalPages: Math.ceil(Number(totalCount[0].count) / parseInt(limit))
        }
      },
      message: "Transaction history retrieved successfully"
    });
  } catch (error: any) {
    console.error("Get transaction history error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
};

// Generate Trial Balance Report
export const getTrialBalance = async (req: any, res: any) => {
  try {
    const { asOfDate } = req.query;
    const cutoffDate = asOfDate ? new Date(asOfDate) : new Date();

    // Get all account balances
    const balances = await db
      .select({
        accountId: accounts.id,
        accountCode: accounts.code,
        accountName: accounts.name,
        accountType: accounts.type,
        normalBalance: accounts.normalBalance,
        debitBalance: accountBalances.debitBalance,
        creditBalance: accountBalances.creditBalance,
        netBalance: accountBalances.netBalance,
      })
      .from(accounts)
      .leftJoin(accountBalances, eq(accounts.id, accountBalances.accountId))
      .where(eq(accounts.isActive, true))
      .orderBy(accounts.code);

    // Calculate totals
    let totalDebits = 0;
    let totalCredits = 0;

    const trialBalanceData = balances.map(balance => {
      const debitBalance = parseFloat(balance.debitBalance || '0');
      const creditBalance = parseFloat(balance.creditBalance || '0');
      
      totalDebits += debitBalance;
      totalCredits += creditBalance;

      return {
        accountCode: balance.accountCode,
        accountName: balance.accountName,
        accountType: balance.accountType,
        normalBalance: balance.normalBalance,
        debitBalance: debitBalance.toFixed(8),
        creditBalance: creditBalance.toFixed(8),
        netBalance: balance.netBalance || '0.00000000'
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        asOfDate: cutoffDate.toISOString(),
        accounts: trialBalanceData,
        totals: {
          totalDebits: totalDebits.toFixed(8),
          totalCredits: totalCredits.toFixed(8),
          difference: (totalDebits - totalCredits).toFixed(8),
          isBalanced: Math.abs(totalDebits - totalCredits) < 0.00000001
        }
      },
      message: "Trial balance generated successfully"
    });
  } catch (error: any) {
    console.error("Get trial balance error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
};

// Get audit trail
export const getAuditTrail = async (req: any, res: any) => {
  try {
    const { page = 1, limit = 50, tableName, recordId, userId } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereConditions = [];
    if (tableName) {
      whereConditions.push(eq(auditTrail.tableName, tableName));
    }
    if (recordId) {
      whereConditions.push(eq(auditTrail.recordId, recordId));
    }
    if (userId) {
      whereConditions.push(eq(auditTrail.userId, userId));
    }

    const auditEntries = await db
      .select()
      .from(auditTrail)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(auditTrail.timestamp))
      .limit(parseInt(limit))
      .offset(offset);

    const totalCount = await db
      .select({ count: sql`count(*)` })
      .from(auditTrail)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    return res.status(200).json({
      success: true,
      data: {
        auditEntries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount[0].count,
          totalPages: Math.ceil(Number(totalCount[0].count) / parseInt(limit))
        }
      },
      message: "Audit trail retrieved successfully"
    });
  } catch (error: any) {
    console.error("Get audit trail error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
};