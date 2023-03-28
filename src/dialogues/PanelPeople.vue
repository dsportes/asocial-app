<template>
<q-layout container view="hHh lpR fFf" :class="sty" style="width:80vw">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="fermer"/>
      <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('APtit', [p.na.nom])}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-card style="min-height:50vh" class="q-pa-sm">
      <apercu-people :id="id" simple />
      <div class="row">
        <div v-if="infoTr.mb.sp" class="titre-md text-bold text-warning">{{$t('PPsp', [infoTr.tribu.na.nom])}}</div>
        <div v-else class="titre-md">{{$t('PPco', [infoTr.tribu.na.nom])}}</div>
        <q-btn v-if="session.estComptable" class="q-ml-sm" dense color="primary" size="sm"
          :label="$t('PPcht')" @click="chgTribu"/>
        <q-btn v-if="session.estComptable" class="q-ml-sm" dense color="primary" size="sm"
          :label="$t('PPchsp')" @click="chgSponsor"/>
      </div>

      <q-btn v-if="session.estComptable || session.estSponsor" class="q-my-sm" dense color="primary" size="sm"
          :label="$t('PPcompta')" @click="voirCompta"/>

      <q-separator color="orange" class="q-my-md q-mx-sm"/>

      <div class="titre-md text-italic y-mb-sm">{{$t('PPchats')}}</div>

      <div v-for="(na, idx) in session.compta.lstAvatarNas" :key="na.id">
        <apercu-chat class="q-my-md" affnai
          :na-i="na" :na-e="p.na" :ids="ids[na.id]" :idx="idx" :mapmc="mapmc"/>
      </div>

      <q-separator color="orange" class="q-my-md q-mx-sm"/>

      <div class="titre-md text-italic y-mb-sm">{{$t('PPgroupes')}}</div>

    </q-card>
  </q-page-container>

  <!-- Changement de tribu -->
  <q-dialog v-model="chgTr" persistent>
    <q-card class="moyennelargeur">
      <div class="titre-lg bg-secondary text-white text-center">{{$t('PPchgtr', [p.na.nom, infoTr.tribu.na.nom])}}</div>
      <div class="q-mx-sm titre-md">{{$t('PPqv1', [cpt.q1, edv1(cpt.q1), pc1])}}</div>
      <div class="q-mx-sm titre-md">{{$t('PPqv2', [cpt.q2, edv2(cpt.q2), pc2])}}</div>

      <q-separator class="q-mt-sm"/>

      <q-card-section>
        <q-input filled v-model="tribus.f" :label="$t('PPnt')" />
        <div class="titre-md text-italic row items-center">
          <div class="col-2 text-center">{{$t('PPc1')}}</div>
          <div class="col-4">{{$t('PPc2')}}</div>
          <div class="col-3 text-center">{{$t('PPc3')}}</div>
          <div class="col-3 text-center" >{{$t('PPc4')}}</div>
        </div>
      </q-card-section>

      <q-card-section style="height: 30vh" class="scroll bord1">
        <div v-for="x in tribus.flst" :key="x.id" 
          :class="'row items-center cursor-pointer' + (x === tribus.sel ? ' bord2' : '')"
          @click="selTr(x)">
          <q-icon class="col-2 text-center" :name="x.ok ? 'check' : 'close'" size="md" :color="x.ok ? 'primary' : 'negative'" />
          <div class="col-4">{{x.nom}}</div>
          <div class="col-3 text-center">{{x.r1}}</div>
          <div class="col-3 text-center">{{x.r2}}</div>
        </div>
      </q-card-section>

      <q-separator />      
      <q-card-actions align="center">
        <q-btn dense color="primary" :label="$t('renoncer')" @click="chgTr=false"/>
        <q-btn dense color="warning" :label="$t('valider')" :disable="!tribus.sel"
          v-close-popup @click="changerTr()"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Changement de statut sponsor -->
  <q-dialog v-model="chgSp" persistent>
    <q-card class="bg-secondary text-white petitelargeur q-pa-sm">
        <div v-if="infoTr.mb.sp" class="text-center q-my-md titre-md">{{$t('PPsp', [infoTr.tribu.na.nom])}}</div>
        <div v-else class="text-center q-my-md titre-md">{{$t('PPco', [infoTr.tribu.na.nom])}}</div>
      <q-card-actions align="center">
        <q-btn dense color="primary" :label="$t('renoncer')" @click="chgSp=false"/>
        <q-btn v-if="infoTr.mb.sp" dense color="warning" :label="$t('PPkosp')" v-close-popup  @click="changerSp(false)"/>
        <q-btn v-else dense color="warning" :label="$t('PPoksp')" v-close-popup  @click="changerSp(true)"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Affichage des compteurs de compta du compte "courant"-->
  <q-dialog v-model="cptdial" persistent full-height>
    <q-card style="width: 800px; max-width: 80vw;">
    <q-toolbar class="bg-secondary text-white">
      <q-btn dense size="md" color="warning" icon="close" @click="cptdial = false"/>
      <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTcompta', [p.na.nomc])}}</q-toolbar-title>
    </q-toolbar>
    <panel-compta :c="cpt" style="margin:0 auto"/>
    </q-card>
  </q-dialog>

</q-layout>
</template>
<script>

import { toRef, ref, onMounted, reactive, watch } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuPeople from '../components/ApercuPeople.vue'
import ApercuChat from '../components/ApercuChat.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import PanelCompta from '../components/PanelCompta.vue'
import { edvol } from '../app/util.mjs'
import { Chat, Motscles } from '../app/modele.mjs'
import { GetCompteursCompta, SetAttributTribu2 } from '../app/operations.mjs'
import { Compteurs, UNITEV1, UNITEV2 } from '../app/api.mjs'

export default {
  name: 'PanelPeople',
  components: { ApercuPeople, BoutonHelp, ApercuChat, PanelCompta },

  props: { id: Number, close: Function },

  computed: {
    pc1 () { return this.cpt.q1 ? Math.round((this.cpt.v1 * 100) / (this.cpt.q1 * UNITEV1)) : 0 },
    pc2 () { return this.cpt.q2 ? Math.round((this.cpt.v2 * 100) / (this.cpt.q2 * UNITEV2)) : 0 }
  },

  watch: {
  },
  
  data () {
    return {
      chgSp: false,
      chgTr: false,
      cptdial: false
    }
  },

  methods: {
    edv1 (v) { return edvol(v * UNITEV1) },
    edv2 (v) { return edvol(v * UNITEV2) },
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    fermer () { if (this.close) this.close() },
    chgTribu () { this.chgTr = true },
    chgSponsor () { this.chgSp = true },
    voirCompta () { this.cptdial = true },
    async changerSp(estSp) { // (id, na, attr, val, val2, exq)
      await new SetAttributTribu2().run(this.trId, this.p.na, 'sp', estSp)
      this.chgSp = false
    },
    selTr (x) { if (x.ok) this.tribus.sel = x },
    async changerTr () {
      console.log()
    }
  },

  setup (props) {
    const ui = stores.ui
    const id = toRef(props, 'id')
    const session = stores.session
    const pStore = stores.people
    const avStore = stores.avatar

    const lstAvc = session.compta.lstAvatarNas
    const ids = reactive({})
    const tribus = reactive({ f:'', lst: [], flst: [], sel: null })
    const mapmc = ref(Motscles.mapMC(true, 0))
    const p = ref(pStore.getPeople(id.value))
    const cpt = ref()

    const trId = ref(session.tribuCId || session.tribuId)

    async function loadCpt () {
      const res = await new GetCompteursCompta().run(id.value)
      cpt.value = new Compteurs(res)
    }

    function getTribus () {
      const y = []
      const q1 = cpt.value.q1
      const q2 = cpt.value.q2
      const l = avStore.getTribus
      l.forEach(x => { 
        if (x.id !== trId.value) {
          const t = x.cpt
          const ok = ((t.q1 - t.a1) >= q1) &&  ((t.q2 - t.a2) >= q2)
          y.push({ nom: x.naC.nom, id: x.id, q1: t.q1, q2: t.q2, r1: t.q1 - t.a1, r2: t.q2 - t.a1, ok   })
        }
      })
      tribus.lst = y
    }

    function filtreTribus () {
      const t = []
      const f = tribus.f
      tribus.lst.forEach(x => { if (x.nom.startsWith(f)) t.push(x) })
      tribus.flst = t
      tribus.sel = null
      if (tribus.flst.length === 1) {
        const x = tribus.flst[0]
        if (x.ok) tribus.sel = x
      }
    }

    // Filtre du nom des tribus
    watch(() => tribus.f, (ap, av) => {
        filtreTribus()
      }
    )

    onMounted(async () => {
      await loadCpt()
      getTribus()
      filtreTribus()
      for(const na of lstAvc) {
        ids[na.id] = await Chat.getIds(na, p.value.na)
      }
    })

    const infoTr = reactive({ tribu: null, tribu2: null, mb: null })
    function setInfoTr() {
      const tc = !session.tribuCId || session.tribuCId === session.tribuId // true si c'est la tribu du compte
      infoTr.tribu = tc ? avStore.tribu : avStore.getTribu(trId.value) // tribu
      infoTr.tribu2 = tc ? avStore.tribu2 : avStore.tribu2C
      infoTr.mb = infoTr.tribu2.mb(id.value)
    }

    avStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setTribuC' || name === 'setTribu2' || name === 'setTribu') {
          setInfoTr()
          getTribus()
          filtreTribus()
        }
      })
    })

    setInfoTr()

    return {
      session,
      mapmc,
      ids,
      lstAvc,
      infoTr,
      trId,
      cpt,
      tribus,
      p
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border: 1px solid $grey-5
.bord2
  background: $yellow-3
  color: black
  font-weight: bold
</style>
