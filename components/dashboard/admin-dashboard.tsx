"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminDashboard() {
  const [stats] = useState({
    totalUsers: 1250,
    totalStudents: 1000,
    totalTeachers: 200,
    totalAdmins: 50,
    literatePercentage: 45,
    semiLiteratePercentage: 40,
    illiteratePercentage: 15,
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Administrator Dashboard</h1>
        <p className="text-neutral-600 mt-2">System-wide analytics and management</p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-neutral-600">Active users in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.totalTeachers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.totalAdmins}</div>
          </CardContent>
        </Card>
      </div>

      {/* Digital Literacy Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Digital Literacy Distribution</CardTitle>
          <CardDescription>Breakdown of user skill levels across the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Literate</span>
                <span className="font-bold text-green-600">{stats.literatePercentage}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div className="bg-green-500 h-3 rounded-full" style={{ width: `${stats.literatePercentage}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Semi-Literate</span>
                <span className="font-bold text-yellow-600">{stats.semiLiteratePercentage}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div
                  className="bg-yellow-500 h-3 rounded-full"
                  style={{ width: `${stats.semiLiteratePercentage}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Illiterate</span>
                <span className="font-bold text-red-600">{stats.illiteratePercentage}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div className="bg-red-500 h-3 rounded-full" style={{ width: `${stats.illiteratePercentage}%` }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-neutral-600">System Status</p>
              <p className="font-semibold text-green-600">✓ Operational</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">Offline Support</p>
              <p className="font-semibold">Enabled</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">Last Sync</p>
              <p className="font-semibold">2 minutes ago</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">Data Version</p>
              <p className="font-semibold">v1.0.0</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
