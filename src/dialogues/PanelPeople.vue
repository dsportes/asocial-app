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

  <!-- Changement de statut sponsor -->
  <q-dialog v-model="chgSp" persistent>
    <q-card class="bg-secondary text-white petitelargeur q-pa-sm">
        <div v-if="infoTr.mb.sp" class="text-center q-my-md titre-md">{{$t('PPsp', [infoTr.tribu.na.nom])}}</div>
        <div v-else class="text-center q-my-md titre-md">{{$t('PPco', [infoTr.tribu.na.nom])}}</div>
      <q-card-actions align="center">
        <q-btn dense color="primary" :label="$t('renoncer')" @click="chgSp=false"/>
        <q-btn v-if="infoTr.mb.sp" dense color="warning" :label="$t('PPkosp')" @click="changerSp(false)"/>
        <q-btn v-else dense color="warning" :label="$t('PPoksp')" @click="changerSp(true)"/>
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

import { toRef, ref, onMounted, reactive } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuPeople from '../components/ApercuPeople.vue'
import ApercuChat from '../components/ApercuChat.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import PanelCompta from '../components/PanelCompta.vue'
// import { afficherDiag } from '../app/util.mjs'
import { Chat, Motscles } from '../app/modele.mjs'
import { GetCompteursCompta, SetAttributTribu2 } from '../app/operations.mjs'
import { Compteurs } from '../app/api.mjs'

export default {
  name: 'PanelPeople',
  components: { ApercuPeople, BoutonHelp, ApercuChat, PanelCompta },

  props: { id: Number, close: Function },

  computed: {
  },

  watch: {
  },
  
  data () {
    return {
      chgSp: false,
      cptdial: false,
      cpt: null
    }
  },

  methods: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    fermer () { if (this.close) this.close() },
    chgTribu () {},
    chgSponsor () { this.chgSp = true},
    async voirCompta () {
      const res = await new GetCompteursCompta().run(this.id)
      this.cpt = new Compteurs(res)
      this.cptdial = true
    },
    async changerSp(estSp) { // (id, na, attr, val, val2, exq)
      await new SetAttributTribu2().run(this.trId, this.p.na, 'sp', estSp)
      this.chgSp = false
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
    const mapmc = ref(Motscles.mapMC(true, 0))
    const p = ref(pStore.getPeople(id.value))

    const trId = ref(session.tribuCId || session.tribuId)

    onMounted(async () => {
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

    // setTribuCourante
    avStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setTribuC' || name === 'setTribu2' || name === 'setTribu') {
          setInfoTr()
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
      p
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-top: 1px solid $grey-5
.bord2p
  border-radius: 3px
  border: 2px solid $warning
  font-weight: bold
  padding: 1px 3px
.ptim
  font-variant: small-caps
.menu
  min-width: 15rem
  padding: 3px
  border-radius: 3px
  border: 1px solid $grey-5
</style>
