<template>
<q-page>
  <panel-compta v-if="ui.pagetab==='compta'" class="spmd q-pa-sm"/>

  <panel-credits v-if="ui.pagetab==='credits'"/>

  <div v-if="ui.pagetab==='notif' && session.compta" class="spmd q-pa-sm">

    <div class="row q-my-md items-center q-ml-sm">
      <notif-icon class="col-auto" :niv="session.ntfIco"/>
      <div class="q-ml-sm titre-lg">{{$t('ANlong' + session.ntfIco)}}</div>
    </div>

    <div class="row q-mt-lg items-center">
      <div class="colauto"><n3-icon :niv="nnbj"/></div>
      <div class="col titre-md">{{$t('PCPnbj', [nbj])}}</div>
    </div>

    <div class="row q-mt-sm items-center">
      <div class="colauto"><n3-icon :niv="npcn"/></div>
      <div class="col titre-md">
        {{$t('PCPqn', [(c.qv.qn * UNITEN), pc.pcn, c.qv.nn, c.qv.nc, c.qv.ng])}}</div>
    </div>
    <div v-if="npcn===3" :class="al">{{$t('ANlong2a')}}</div>

    <div class="row q-my-sm items-center">
      <div class="colauto"><n3-icon :niv="npcv"/></div>
      <div class="col titre-md">
        {{$t('PCPqv', [edvol(c.qv.qv * UNITEV), pc.pcv, c.qv.v])}}</div>
    </div>
    <div v-if="npcv===3" :class="al">{{$t('ANlong2b')}}</div>

    <div v-if="session.compte.estA" class="row q-mt-sm items-center">
      <div class="colauto"><n3-icon :niv="nnj"/></div>
      <div class="col titre-md">{{$t('PCPsolde', [s, nj])}}</div>
    </div>
    <div v-if="session.compte.estA && nnj===3" :class="al">{{$t('ANlong5')}}</div>

    <div v-if="!session.compte.estA" class="row q-mt-sm items-center">
      <div class="colauto"><n3-icon :niv="npcc"/></div>
      <div class="col titre-md">{{$t('PCPqcal', [c.qv.qc, pc.pcc])}}</div>
    </div>
    <div v-if="!session.compte.estA && npcc===2" :class="al">{{$t('ANlong7')}}</div>
    <div v-if="!session.compte.estA && npcc===3" :class="al">{{$t('ANlong8')}}</div>

    <q-separator color="orange" class="q-mt-md"/>
    <div class="row q-my-sm items-start">
      <div class="colauto"><n3-icon :niv="session.ntfE ? session.ntfE.nr : 0"/></div>
      <apercu-notif class="q-ml-sm col" :idx="0" :type="0" :notif="session.ntfE"/>
    </div>

    <div v-if="!session.compte.estA">
      <q-separator color="orange" class="q-mt-md"/>
      <div class="row q-my-sm items-start">
        <div class="colauto"><n3-icon :niv="session.ntfP ? session.ntfP.nr : 0"/></div>
        <apercu-notif class="q-ml-sm" :idx="1" :type="1" :notif="session.ntfP"/>
      </div>
      <q-separator color="orange" class="q-mt-md"/>
      <div class="row q-my-sm items-start">
        <div class="colauto"><n3-icon :niv="session.ntfC ? session.ntfC.nr : 0"/></div>
        <apercu-notif  class="q-ml-sm" :idx="2" :type="2" :notif="session.ntfC"/>
      </div>
    </div>
  </div>

  <div v-if="ui.pagetab==='chats'" class="spmd q-pa-sm">
    <div class="titre-lg text-italic text-center q-py-md">{{$t('CPTtitch')}}</div>

    <btn-cond class="q-my-sm" 
      :cond="session.estAdmin ? 'cUrgence' : 'cVisu'"
      :label="$t('CVraf')" @ok="rafCvs"/>

    <q-card v-for="(e, idx) in lurg" :key="e.id">
      <div :class="'q-my-sm q-px-sm ' + dkli(idx)">
        <apercu-genx :id="e.id" :del="e.del" :idx="idx" />
        <micro-chat :id-e="e.id" :id-i="session.compteId" :del="e.del"/>
      </div>
    </q-card>
  </div>

  <q-page-sticky position="top-left" :offset="[3, 3]">
    <q-btn size="md" color="primary" icon="refresh" padding="none" @click="reload()"/>
  </q-page-sticky>
</q-page>
</template>

<script>

import { onMounted } from 'vue'
import stores from '../stores/stores.mjs'
import PanelCompta from '../components/PanelCompta.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import ApercuNotif from '../components/ApercuNotif.vue'
import PanelCredits from '../components/PanelCredits.vue'
import MicroChat from '../components/MicroChat.vue'
import BtnCond from '../components/BtnCond.vue'
import { dkli, edvol } from '../app/util.mjs'
import { getNg } from '../app/modele.mjs'
import { GetCompta, GetPartition } from '../app/synchro.mjs'
import N3Icon from '../components/N3Icon.vue'
import NotifIcon from '../components/NotifIcon.vue'
import { UNITEN, UNITEV, ID } from '../app/api.mjs'
import { RafraichirCvsAv } from '../app/operations4.mjs'

export default {
  name: 'PageCompta',

  components: { BtnCond, N3Icon, NotifIcon, MicroChat, ApercuGenx, ApercuNotif, PanelCompta, PanelCredits },

  computed: {
    al () { return 'titre-md text-italic bg-yellow-3 text-negative text-bold q-mb-xs q-ml-xl'},
    // nbj () { return 5 },
    nbj () { return this.session.compte.nbj },
    nnbj () { return this.nbj > 40 ? 1 : (this.nbj > 10 ? 2 : 3)},
    nac () { return getNg(this.session.compteId) },
    c () { return this.session.compta.compteurs },
    s ()  { return this.session.compta.solde },
    pc () { return this.c.pourcents },
    npcn () { return this.pc.pcn < 80 ? 1 : (this.pc.pcn <= 90 ? 2 : 3)},
    // npcv () { return 3 },
    npcv () { return this.pc.pcv < 80 ? 1 : (this.pc.pcv <= 90 ? 2 : 3)},
    // npcc () { return 2 },
    npcc () { return this.pc.pcc < 80 ? 1 : (this.pc.pcc <= 90 ? 2 : 3)},
    nj () { return this.c.nbj(this.session.compta.solde) },
    nnj () { return this.nj > 40 ? 1 : (this.nj > 10 ? 2 : 3)},
    lurg () {
      const l = [{ id: ID.long(ID.duComptable(this.session.ns), this.session.ns)}]
      const p = this.session.partition
      if (!p) return l
      for (const idx in p.mcpt) {
        const e = p.mcpt[idx]
        const id = ID.long(parseInt(idx), this.session.ns)
        if (id !== this.session.compteId)
          l.push({ del: e.del, id: id })
      }
      return l
    }
  },

  data () {
    return {
    }
  },

  methods: {
    onok (ctx) {
      console.log(ctx)
    },
    async rafCvs () {
      let nc = 0, nv = 0
      for (const id of this.session.compte.mav) {
        const [x, y] = await new RafraichirCvsAv().run(id)
        nc += x; nv += y
      }
      stores.ui.afficherMessage(this.$t('CVraf2', [nc, nv]), false)
    },

  },

  setup () {
    const session = stores.session

    async function reload () {
      await new GetCompta().run()
      if (!session.estA) await new GetPartition().run(session.compte.idp)
    }

    onMounted(async () => { await reload() })

    return {
      session, 
      ui: stores.ui, 
      dkli, UNITEN, UNITEV, edvol, reload
    }
  }
}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.rld
  position: absolute
  top: -24px
  left: 0
</style>
